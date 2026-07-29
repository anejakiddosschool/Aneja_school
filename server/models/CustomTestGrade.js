// server/models/CustomTestGrade.js
// Stores individual student scores for each custom test
const mongoose = require('mongoose');

const customTestGradeSchema = new mongoose.Schema({
    customTest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomTest',
        required: true,
        index: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    score: {
        type: Number,
        required: [true, 'Score is required'],
        min: 0
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    gradeLevel: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Each student can only have one grade per custom test
customTestGradeSchema.index({ customTest: 1, student: 1 }, { unique: true });

// For efficient grade queries
customTestGradeSchema.index({ customTest: 1 });

module.exports = mongoose.model('CustomTestGrade', customTestGradeSchema);
