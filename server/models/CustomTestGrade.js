// server/models/CustomTestGrade.js
// Stores individual student scores for each custom test
const mongoose = require('mongoose');

const customTestGradeSchema = new mongoose.Schema({
    customTest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomTest',
        required: true
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
// (compound index also covers { customTest: 1 } prefix queries, so no separate index needed)
customTestGradeSchema.index({ customTest: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('CustomTestGrade', customTestGradeSchema);
