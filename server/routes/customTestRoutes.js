// server/routes/customTestRoutes.js
const express = require('express');
const router = express.Router();
const {
    createCustomTest,
    getCustomTests,
    getCustomTestById,
    deleteCustomTest,
    getTestStudents,
    saveTestMarks,
    generateStudentPdf,
    sendPdfToParent,
    sendPdfToSelectedParents,
    sendPdfToAllParents
} = require('../controllers/customTestController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// CRUD routes
router.route('/')
    .post(authorize('admin', 'teacher'), createCustomTest)
    .get(getCustomTests);

router.route('/:id')
    .get(getCustomTestById)
    .delete(authorize('admin', 'teacher'), deleteCustomTest);

// Marks entry
router.get('/:id/students', getTestStudents);
router.post('/:id/marks', authorize('admin', 'teacher'), saveTestMarks);

// PDF generation
router.get('/:id/pdf/:studentId', generateStudentPdf);

// WhatsApp sending
router.post('/:id/send/:studentId', authorize('admin', 'teacher'), sendPdfToParent);
router.post('/:id/send-selected', authorize('admin', 'teacher'), sendPdfToSelectedParents);
router.post('/:id/send-all', authorize('admin', 'teacher'), sendPdfToAllParents);

module.exports = router;
