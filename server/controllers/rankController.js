// backend/controllers/rankController.js
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// @desc    Calculate a student's rank in their class for a semester
// @route   GET /api/ranks/class-rank/:studentId?academicYear=...&semester=...
exports.getStudentRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, semester, gradeLevel } = req.query;

    if (!academicYear || !semester || !gradeLevel) {
        return res.status(400).json({ message: 'Year, semester, and grade level are required' });
    }

    try {
        // OPTIMIZED: Resolve class student IDs first (indexed query), then aggregate
        // with $match first instead of $lookup-then-match over the whole collection.
        const classmates = await Student.find({ gradeLevel }).select('_id').lean();
        const classmateIds = classmates.map((s) => s._id);

        if (classmateIds.length === 0) {
            return res.status(200).json({ rank: 'N/A' });
        }

        const rankedList = await Grade.aggregate([
            // Stage 1: Match FIRST (uses index) — only grades of this class/year/semester
            {
                $match: {
                    student: { $in: classmateIds },
                    academicYear: academicYear,
                    semester: semester,
                }
            },
            // Stage 2: Group grades by student and calculate their average score
            {
                $group: {
                    _id: '$student',
                    averageScore: { $avg: '$finalScore' }
                }
            },
            // Stage 3: Sort the entire class by average score, descending
            {
                $sort: { averageScore: -1 }
            }
        ]);

        // Stage 4: Find the index (position) of our target student in the sorted list
        const studentRank = rankedList.findIndex(
            item => item._id.toString() === studentId
        );

        if (studentRank === -1) {
            // This means the student has no grades for this semester
            return res.status(200).json({ rank: 'N/A' });
        }

        // The rank is the index + 1
        res.status(200).json({ rank: studentRank + 1 });

    } catch (error) {
        console.error('Error calculating rank:', error);
        res.status(500).json({ message: 'Server error while calculating rank' });
    }
};


// @desc    Calculate a student's overall rank for the year
// @route   GET /api/ranks/overall-rank/:studentId?academicYear=...&gradeLevel=...
exports.getOverallRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, gradeLevel } = req.query;

    if (!academicYear || !gradeLevel) {
        return res.status(400).json({ message: 'Year and grade level are required' });
    }

    try {
        // OPTIMIZED: same approach as semester rank — resolve class first, match first
        const classmates = await Student.find({ gradeLevel }).select('_id').lean();
        const classmateIds = classmates.map((s) => s._id);

        if (classmateIds.length === 0) {
            return res.status(200).json({ rank: 'N/A' });
        }

        const rankedList = await Grade.aggregate([
            {
                $match: {
                    student: { $in: classmateIds },
                    academicYear: academicYear,
                }
            },
            {
                $group: {
                    _id: '$student',
                    overallAverage: { $avg: '$finalScore' }
                }
            },
            {
                $sort: { overallAverage: -1 }
            }
        ]);

        // Stage 4: Find the student's position in the sorted list
        const studentRank = rankedList.findIndex(
            item => item._id.toString() === studentId
        );

        if (studentRank === -1) {
            return res.status(200).json({ rank: 'N/A' });
        }

        res.status(200).json({ rank: studentRank + 1 });

    } catch (error) {
        console.error('Error calculating overall rank:', error);
        res.status(500).json({ message: 'Server error while calculating rank' });
    }
};