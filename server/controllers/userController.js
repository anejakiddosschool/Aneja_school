const express = require('express');
const xlsx = require('xlsx');
const fs = require('fs');
const User = require('../models/User');
const Subject = require('../models/Subject'); // 🌟 ADDED SUBJECT MODEL HERE
const capitalizeName = require('../utils/capitalizeName');
const generateToken = require('../utils/generateToken');


// @desc    Get all users (for Admin)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .populate('subjectsTaught.subject');
        
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get the current logged-in user's profile
// @route   GET /api/users/profile
exports.getUserProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = await User.findById(req.user._id).populate('subjectsTaught.subject');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Convert to plain JS object to allow adding properties dynamically
        const userObj = user.toObject();

        // Safe array initialization
        if (!userObj.subjectsTaught) {
            userObj.subjectsTaught = [];
        }

        // 🌟 HOMEROOM TEACHER LOGIC 🌟
        // If the user has a homeroom grade assigned, fetch all subjects for that grade
        if (user.homeroomGrade && user.homeroomGrade.trim() !== '') {
            const allClassSubjects = await Subject.find({ gradeLevel: user.homeroomGrade });
            
            // Format these subjects to match the 'subjectsTaught' array structure
            const formattedClassSubjects = allClassSubjects.map(subj => ({
                subject: {
                    _id: subj._id,
                    name: subj.name,
                    gradeLevel: subj.gradeLevel,
                }
            }));

            // Extract IDs safely to avoid null reference crashes
            const existingSubjectIds = userObj.subjectsTaught
                .filter(s => s && s.subject && s.subject._id)
                .map(s => s.subject._id.toString());
            
            // Merge the class subjects into the teacher's subjectsTaught array
            formattedClassSubjects.forEach(newSubj => {
                if (newSubj.subject && newSubj.subject._id && !existingSubjectIds.includes(newSubj.subject._id.toString())) {
                    userObj.subjectsTaught.push(newSubj);
                }
            });
        }

        // Final cleanup: remove any deleted subjects that came as null before sending to frontend
        userObj.subjectsTaught = userObj.subjectsTaught.filter(s => s && s.subject && s.subject._id);

        res.json(userObj);
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get user by ID (for Admin)
// @route   GET /api/users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('subjectsTaught.subject');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Update user (for Admin to assign subjects)
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
    try {
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { fullName, role, subjectsTaught, homeroomGrade, phoneNumber } = req.body;

        // --- VALIDATION 1: Check for Subject Assignment Conflicts ---
        if (subjectsTaught) {
            const subjectIdsToAssign = subjectsTaught.map(item => item.subject);
            const conflictingTeacher = await User.findOne({
                'subjectsTaught.subject': { $in: subjectIdsToAssign },
                _id: { $ne: userToUpdate._id }
            }).populate('subjectsTaught.subject');

            if (conflictingTeacher) {
                const conflictingSubject = conflictingTeacher.subjectsTaught.find(
                    assignment => subjectIdsToAssign.includes(assignment.subject._id.toString())
                ).subject;
                return res.status(400).json({
                    message: `Assignment failed. The subject "${conflictingSubject.name} (${conflictingSubject.gradeLevel})" is already assigned to another teacher: ${conflictingTeacher.fullName}.`
                });
            }
        }

        // --- VALIDATION 2: Check for Homeroom Teacher Conflicts ---
        if (homeroomGrade) {
            const conflictingHomeroomTeacher = await User.findOne({
                homeroomGrade: homeroomGrade,
                _id: { $ne: userToUpdate._id }
            });

            if (conflictingHomeroomTeacher) {
                return res.status(400).json({
                    message: `Assignment failed. The grade "${homeroomGrade}" already has a homeroom teacher: ${conflictingHomeroomTeacher.fullName}.`
                });
            }
        }

        // --- UPDATE FIELDS ---
        userToUpdate.fullName = capitalizeName(fullName || userToUpdate.fullName);
        userToUpdate.role = role || userToUpdate.role;

        if (phoneNumber !== undefined) {
            userToUpdate.phoneNumber = phoneNumber;
        }

        if (subjectsTaught !== undefined) {
            userToUpdate.subjectsTaught = subjectsTaught;
        }

        if (homeroomGrade !== undefined) {
            userToUpdate.homeroomGrade = homeroomGrade || null;
        }

        const updatedUser = await userToUpdate.save();
        await updatedUser.populate('subjectsTaught.subject');

        res.json(updatedUser);

    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};


// @desc    Update the logged-in user's own profile
// @route   PUT /api/users/profile
exports.updateUserProfile = async (req, res) => {
    console.log("Update Profile Request Body:", req.body);
    try {
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.fullName = req.body.fullName || user.fullName;
        user.username = req.body.username || user.username;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

        if (req.body.currentPassword && req.body.newPassword) {
            const isMatch = await user.matchPassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect current password.' });
            }

            user.password = req.body.newPassword;
        }

        const updatedUser = await user.save();
        const token = generateToken(updatedUser._id, 'user');

        res.json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            username: updatedUser.username,
            role: updatedUser.role,
            homeroomGrade: updatedUser.homeroomGrade,
            phoneNumber: updatedUser.phoneNumber,
            token: token
        });

    } catch (error) {
        console.log("Error updating profile:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'That username is already taken.' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Create multiple users from an uploaded Excel file (Admin only)
// @route   POST /api/users/upload
exports.bulkCreateUsers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const filePath = req.file.path;

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const usersJson = xlsx.utils.sheet_to_json(worksheet);

        if (usersJson.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'The Excel file is empty.' });
        }

        const usersToProcess = usersJson.map(user => {
            const initialPassword = user['Password'] || user['password'];
            if (!initialPassword) {
                throw new Error(`Password is missing for user: ${user['Full Name'] || user['Username']}`);
            }

            return {
                fullName: user['Full Name'] || user['fullName'],
                username: user['Username'] || user['username'],
                phoneNumber: user['Phone Number'] || user['phoneNumber'] || null,
                role: (user['Role'] || user['role'] || 'teacher').toLowerCase(),
                password: initialPassword,
                initialPassword: initialPassword
            };
        });

        const createdUsersForResponse = [];

        for (const userData of usersToProcess) {
            const user = new User({
                fullName: capitalizeName(userData.fullName),
                username: userData.username,
                phoneNumber: userData.phoneNumber,
                role: userData.role,
                password: userData.password
            });

            await user.save();

            createdUsersForResponse.push({
                fullName: user.fullName,
                username: user.username,
                phoneNumber: user.phoneNumber,
                role: user.role,
                initialPassword: userData.initialPassword
            });
        }

        fs.unlinkSync(filePath);
        res.status(201).json({
            message: `${createdUsersForResponse.length} users imported successfully.`,
            data: createdUsersForResponse
        });

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (error.code === 11000 || error.name === 'MongoBulkWriteError' || error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Import failed. One or more usernames may already exist or have invalid data.' });
        }
        console.error('Error importing users:', error);
        res.status(500).json({ message: 'An error occurred during the import process.' });
    }
};


// @desc    Get the homeroom teacher for a specific grade level
// @route   GET /api/users/homeroom-teacher?gradeLevel=...
exports.getHomeroomTeacher = async (req, res) => {
    const { gradeLevel } = req.query;
    if (!gradeLevel) {
        return res.status(400).json({ message: 'Grade Level is required.' });
    }

    try {
        const homeroomTeacher = await User.findOne({
            role: 'teacher',
            homeroomGrade: gradeLevel
        }).select('fullName');

        if (homeroomTeacher) {
            res.json(homeroomTeacher);
        } else {
            res.status(404).json({ message: 'No homeroom teacher found for this grade level.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};
