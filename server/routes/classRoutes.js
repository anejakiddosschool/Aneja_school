// server/routes/classRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getAllGrades, 
    getAllSections, 
    createGrade, 
    deleteGrade,
    createSection,
    deleteSection
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all unique grade levels (protected - any logged in user)
router.get('/grades', protect, getAllGrades);

// Get all sections (protected - any logged in user)
router.get('/sections', protect, getAllSections);

// Create a new grade level (admin only)
router.post('/grades', protect, authorize('admin'), createGrade);

// Delete a grade level (admin only)
router.delete('/grades/:gradeLevel', protect, authorize('admin'), deleteGrade);

// Create a new section for a grade level (admin only)
router.post('/sections', protect, authorize('admin'), createSection);

// Delete a section (admin only)
router.delete('/sections/:id', protect, authorize('admin'), deleteSection);

module.exports = router;
