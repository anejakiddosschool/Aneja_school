const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const AssessmentType = require('../models/AssessmentType');
const Subject = require('../models/Subject'); // Added this for subject lookup

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
             req.user = await User.findById(decoded.id).select('-password').populate('subjectsTaught.subject');
            next(); 
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role '${req.user.role}' is not authorized to access this route` 
            });
        }
        next();
    };
};

// 🌟 FIX: Checked for Homeroom Teacher in Subject Access
exports.isTeacherForSubject = async (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }
    
    if (req.user.role === 'teacher') {
        const subjectId = req.query.subjectId || req.body.subjectId;

        if (!subjectId) {
            // Agar specific subject id nahi hai, pass hone do, baaki middleware aage rok lenge
            return next(); 
        }

        // 1. Agar wo class ka homeroom teacher hai, toh allow karo
        try {
            const subject = await Subject.findById(subjectId);
            if (subject && req.user.homeroomGrade === subject.gradeLevel) {
                return next();
            }
        } catch(err) {
            console.error("Subject check error", err);
        }

        // 2. Agar homeroom nahi hai, to check karo ki isko explicitly assign kiya hai kya
        const isAuthorized = req.user.subjectsTaught.some(
            assignment => assignment.subject && assignment.subject._id.toString() === subjectId.toString()
        );

        if (isAuthorized) {
            return next(); 
        } else {
            return res.status(403).json({ message: 'Forbidden: You are not assigned to this class or subject.' });
        }
    }
};

exports.isHomeroomTeacherOrAdmin = (req, res, next) => {
    const requestedGradeLevel = req.query.gradeLevel || req.body.gradeLevel;
    if (!requestedGradeLevel) {
        return res.status(400).json({ message: 'Grade Level is required.' });
    }

    const { role, homeroomGrade } = req.user;

    if (role === 'admin') {
        return next();
    }

    if (role === 'teacher' && homeroomGrade && homeroomGrade === requestedGradeLevel) {
        return next();
    }

    return res.status(403).json({ message: 'Forbidden: You are not the homeroom teacher for this grade.' });
};

// 🌟 FIX: Robust homeroom teacher checking
exports.isHomeroomTeacherForStudent = async (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }

    let studentId = req.body.studentId || req.params.studentId || req.params.id;
    if (!studentId && req.params.reportId) {
        // Mock import/fix for behavioral report check if needed
        return next(); // Handle report check separately or pass through if reportId
    }
    
    if (!studentId) return res.status(400).json({ message: 'Student ID is required.' });

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        if (
            req.user.role === 'teacher' && 
            req.user.homeroomGrade &&
            req.user.homeroomGrade === student.gradeLevel
        ) {
            return next(); // Authorized!
        }

        return res.status(403).json({ message: 'Forbidden: You are not the homeroom teacher for this student.' });
    } catch(err) {
        return res.status(500).json({ message: 'Server error checking student permissions.' });
    }
};

exports.protectStudent = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.type !== 'student') {
                return res.status(401).json({ message: 'Not authorized, invalid token type' });
            }
            
            req.student = await Student.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) res.status(401).json({ message: 'Not authorized, no token' });
};

// 🌟 FIX: Updated canViewStudentData to give Homeroom Teacher full access
exports.canViewStudentData = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.type === 'user') {
                const user = await User.findById(decoded.id).populate('subjectsTaught.subject');
                
                if (!user) {
                    return res.status(401).json({ message: 'User not found.' });
                }
                req.user = user;

                if (user.role === 'admin') {
                    return next();
                }

                if (user.role === 'teacher') {
                    const requestedStudentId = req.params.id || req.params.studentId;
                    
                    if (requestedStudentId) {
                        const student = await Student.findById(requestedStudentId);
                        if (!student) {
                            return res.status(404).json({ message: 'Student not found.' });
                        }

                        // HOMEROOM TEACHER ACCESS: Pura allowed
                        if (user.homeroomGrade && user.homeroomGrade === student.gradeLevel) {
                            return next();
                        }

                        const isAuthorized = user.subjectsTaught.some(
                            assignment => assignment.subject && assignment.subject.gradeLevel === student.gradeLevel
                        );

                        if (isAuthorized) {
                            return next();
                        }
                    } else {
                        // generic fetch
                        return next();
                    }
                }
            }
            
            if (decoded.type === 'student') {
                const requestedStudentId = req.params.id || req.params.studentId;
                if (decoded.id === requestedStudentId) {
                    return next();
                }
            }

            return res.status(403).json({ message: 'Forbidden: You do not have permission to view this data.' });
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token is invalid.' });
        }
    }
    
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
};

exports.authorizeAnalytics = async (req, res, next) => {
    try {
        const { assessmentTypeId } = req.query;
        if (!assessmentTypeId) return res.status(400).json({ message: 'Assessment Type ID is required.' });

        const assessmentType = await AssessmentType.findById(assessmentTypeId).populate('subject');
        if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });
        
        const subjectId = assessmentType.subject._id.toString();
        const gradeLevel = assessmentType.subject.gradeLevel;

        const user = req.user; 
        
        if (user.role === 'admin') {
            return next();
        }

        if (user.role === 'teacher') {
            // HOMEROOM TEACHER ko Analytics dekhne do
            if (user.homeroomGrade === gradeLevel) {
                return next();
            }

            const teacherSubjectIds = user.subjectsTaught.map(a => a.subject?._id.toString());
            if (teacherSubjectIds.includes(subjectId)) {
                return next();
            }
        }
        
        return res.status(403).json({ message: 'Forbidden: You are not authorized to view this analysis.' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
