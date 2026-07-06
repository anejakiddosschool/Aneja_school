// server/models/Section.js
const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  gradeLevel: {
    type: String,
    required: [true, 'Grade level is required'],
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  }
}, {
  timestamps: true
});

// Ensure unique section per grade level
sectionSchema.index({ gradeLevel: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
