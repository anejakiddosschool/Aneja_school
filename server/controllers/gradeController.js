const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AssessmentType = require('../models/AssessmentType');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const webpush = require('web-push');

const getAcademicYearQuery = (yearString) => {
    if (!yearString) return null;
    const baseYear = yearString.split('-')[0]; 
    return { $in: [yearString, baseYear] };
};

exports.getGradeById = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id).populate('subject', 'name');
        if (!grade) return res.status(404).json({ message: 'Grade not found' });
        res.status(200).json({ success: true, data: grade });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getGrades = async (req, res) => {
    try {
        const grades = await Grade.find({}).populate('student', 'fullName studentId').populate('subject', 'name'); 
        res.status(200).json({ success: true, count: grades.length, data: grades });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getGradesByStudent = async (req, res) => {
    try {
        const studentId = req.params.id || req.params.studentId;
        let gradesQuery = Grade.find({ student: studentId })
            .populate('subject', 'name gradeLevel')
            .populate('assessments.assessmentType');

        let allGrades = await gradesQuery;
        allGrades = allGrades.filter(grade => grade.subject !== null);

        res.status(200).json({ success: true, count: allGrades.length, data: allGrades });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getGradeDetails = async (req, res) => {
    const { studentId, subjectId, semester, academicYear } = req.query;
    try {
        const yearQuery = getAcademicYearQuery(academicYear);
        const grade = await Grade.findOne({ 
            student: studentId, subject: subjectId, semester, academicYear: yearQuery
        });
        res.json({ success: true, data: grade });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteGrade = async (req, res) => {
    const grade = await Grade.findById(req.params.id);
    if (req.user.role === 'admin') return res.status(403).json({ message: "Forbidden" });
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    
    await grade.deleteOne();
    res.status(200).json({ success: true, message: 'Grade deleted' });
};

exports.updateGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id).populate('subject');
        if (!grade) return res.status(404).json({ message: 'Grade record not found' });
        
        if (req.user.role === 'admin') return res.status(403).json({ message: "Admins cannot alter grade records." });

        const { assessments } = req.body;
        let newFinalScore = 0;

        if (assessments && assessments.length > 0) {
            const assessmentTypeIds = assessments.map(a => a.assessmentType);
            const assessmentTypeDefs = await AssessmentType.find({ '_id': { $in: assessmentTypeIds } });

            for (const assessment of assessments) {
                const def = assessmentTypeDefs.find(d => d._id.equals(assessment.assessmentType));
                if (!def) return res.status(400).json({ message: `Invalid ID: ${assessment.assessmentType}` });
                
                const scoreValue = Number(assessment.score);
                if (scoreValue > def.totalMarks) return res.status(400).json({ message: `Score cannot exceed ${def.totalMarks}.` });
                newFinalScore += scoreValue;
            }
        }

        grade.assessments = assessments;
        grade.finalScore = newFinalScore;
        const updatedGrade = await grade.save();
        res.status(200).json({ success: true, data: updatedGrade });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// 🌟 FIX IN GET SHEET: Force Sort and Mapping so latest/updated score always applies
exports.getGradeSheet = async (req, res) => {
    const { assessmentTypeId, academicYear } = req.query; 
    if (!assessmentTypeId) return res.status(400).json({ message: 'Assessment Type ID is required.' });

    try {
        const assessmentType = await AssessmentType.findById(assessmentTypeId);
        if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });
        
        const students = await Student.find({ gradeLevel: assessmentType.gradeLevel, status: 'Active' }).sort({ fullName: 1 });
        const studentIds = students.map(s => s._id);
        const yearQuery = getAcademicYearQuery(academicYear);

        const query = { 
            student: { $in: studentIds },
            'assessments.assessmentType': assessmentTypeId
        };
        if (yearQuery) {
            query.academicYear = yearQuery;
        }

        // Add sorting by updated so we always catch the latest edited doc if duplicate exists
        const grades = await Grade.find(query).sort({ updatedAt: -1 });

        const sheetData = students.map(student => {
            // Find first (which is the newest due to sort) gradedoc for this student
            const gradeDoc = grades.find(g => g.student.equals(student._id));
            let currentScore = null;
            if (gradeDoc) {
                const assessment = gradeDoc.assessments.find(a => a.assessmentType.equals(assessmentTypeId));
                // Explicitly check for number or 0
                if (assessment && (assessment.score || assessment.score === 0)) {
                    currentScore = assessment.score;
                }
            }
            return {
                _id: student._id,
                fullName: student.fullName,
                score: currentScore
            };
        });

        res.json({ assessmentType, students: sheetData });
    } catch (error) {
        res.status(500).json({ message: "Server error fetching grade sheet." });
    }
};


// 🌟 FIX IN SAVE SHEET
exports.saveGradeSheet = async (req, res) => {
    const { assessmentTypeId, subjectId, semester, academicYear, scores } = req.body;
    
    if (!assessmentTypeId || !scores || !subjectId) {
        return res.status(400).json({ message: 'Missing required data.' });
    }
    
    try {
        const yearQuery = getAcademicYearQuery(academicYear);

        for (const item of scores) {
            // Do not skip if score is exactly 0
            if (item.score === null || item.score === undefined || item.score === '') continue;

            const scoreValue = Number(item.score);

            // Attempt to find the existing document to update
            let gradeDoc = await Grade.findOne({
                student: item.studentId,
                subject: subjectId,
                semester,
                academicYear: yearQuery
            }).sort({ updatedAt: -1 }); // take the most recent if dupe exists

            if (!gradeDoc) {
                // Not found, create purely new
                gradeDoc = new Grade({
                    student: item.studentId, 
                    subject: subjectId, 
                    semester, 
                    academicYear: academicYear, 
                    assessments: [{ assessmentType: assessmentTypeId, score: scoreValue }],
                    finalScore: scoreValue 
                });
            } else {
                // Upgrade year to strict string (e.g. 2025 -> 2025-2026) to prevent dual entries
                gradeDoc.academicYear = academicYear;

                const assessmentIndex = gradeDoc.assessments.findIndex(a => a.assessmentType.equals(assessmentTypeId));
                
                if (assessmentIndex > -1) {
                    gradeDoc.assessments[assessmentIndex].score = scoreValue;
                } else {
                    gradeDoc.assessments.push({ assessmentType: assessmentTypeId, score: scoreValue });
                }
                
                gradeDoc.finalScore = gradeDoc.assessments.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
            }
            await gradeDoc.save();
        }

        res.status(200).json({ message: "Grades saved successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error saving grades." });
    }
};