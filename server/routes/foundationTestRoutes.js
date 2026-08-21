const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const adminOnly = authorize('admin');
const {
  createFoundationTest,
  getFoundationTests,
  getFoundationTestById,
  getFoundationTestStudents,
  saveFoundationTestMarks,
  sendMergedPdf,
  downloadMergedPdf,
  previewMergedPdf,
  previewAllPdf,
  deleteFoundationTest,
} = require('../controllers/foundationTestController');

router.post('/', protect, adminOnly, createFoundationTest);
router.get('/', protect, getFoundationTests);
router.get('/:id', protect, getFoundationTestById);
router.get('/:id/students', protect, getFoundationTestStudents);
router.post('/:id/marks', protect, saveFoundationTestMarks);
router.post('/:id/send', protect, sendMergedPdf);
router.get('/:id/preview/:studentId', protect, previewMergedPdf);
router.get('/:id/preview', protect, previewAllPdf);
router.get('/:id/download/:studentId', protect, downloadMergedPdf);
router.delete('/:id', protect, adminOnly, deleteFoundationTest);

module.exports = router;
