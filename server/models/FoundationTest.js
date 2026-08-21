const mongoose = require('mongoose');

const foundationTestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    gradeLevel: {
        type: String,
        required: true
    },
    // Subjects included: [{ subjectId, marks }]
    subjects: [{
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
        marks: { type: Number, required: true, min: 1 },
        _id: false
    }],
    totalMarks: {
        type: Number,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semester: {
        type: String,
        default: 'First Semester'
    },
    academicYear: {
        type: String
    },
    expiresAt: { type: Date }
}, { timestamps: true });

// Auto-delete after 15 days
foundationTestSchema.pre('save', function (next) {
    if (this.isNew && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    }
    next();
});

foundationTestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('FoundationTest', foundationTestSchema);
