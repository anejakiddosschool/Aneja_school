// server/models/CustomTest.js
// Custom Test model - Fully flexible test creation with auto-delete after 15 days
const mongoose = require('mongoose');

const customTestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Test name is required'],
        trim: true,
        maxlength: [100, 'Test name cannot exceed 100 characters']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required']
    },
    gradeLevel: {
        type: String,
        required: [true, 'Grade level is required'],
        trim: true
    },
    totalMarks: {
        type: Number,
        required: [true, 'Total marks is required'],
        min: [1, 'Total marks must be at least 1']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semester: {
        type: String,
        enum: ['First Semester', 'Second Semester'],
        default: 'First Semester'
    },
    academicYear: {
        type: String,
        default: () => {
            const year = new Date().getFullYear();
            return `${year}-${year + 1}`;
        }
    },
    // Auto-calculate expiry date: 15 days from creation
    expiresAt: {
        type: Date
    },
    // Link to FoundationTest group (for merged tests)
    foundationGroup: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Set expiresAt to 15 days after creation
customTestSchema.pre('save', function (next) {
    if (this.isNew && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days
    }
    next();
});

// TTL Index: MongoDB automatically deletes documents when expiresAt is reached
customTestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient querying
customTestSchema.index({ subject: 1, gradeLevel: 1 });
customTestSchema.index({ createdBy: 1, createdAt: -1 });

// Index for FoundationTest group queries
customTestSchema.index({ foundationGroup: 1 });

module.exports = mongoose.model('CustomTest', customTestSchema);
