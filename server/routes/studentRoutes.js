
// const express = require("express");
// const multer = require("multer");
// const router = express.Router();
// const {
//   createStudent,
//   getStudents,
//   getStudentById,
//   updateStudent,
//   deleteStudent,
//   bulkCreateStudents,
//   uploadProfilePhoto,
//   uploadClassTestReport,
//   getClassTestReport,
//   deleteClassTestReport,
//   uploadNtseReport,
//   getNtseReport,
//   deleteNtseReport,
// } = require("../controllers/studentController");

// const { uploadReportCard } = require("../controllers/studentController");
// const { deleteReportCard } = require("../controllers/studentController");

// const {
//   protect,
//   authorize,
//   canViewStudentData,
// } = require("../middleware/authMiddleware");

// // Import the main multer instance we just created
// const upload = require("../middleware/upload");

// // Standard JSON routes
// router
//   .route("/")
//   .post(protect, authorize("admin"), createStudent)
//   .get(protect, getStudents);

// router
//   .route("/:id")
//   .get(canViewStudentData, getStudentById)
//   .put(protect, authorize("admin"), updateStudent)
//   .delete(protect, authorize("admin"), deleteStudent);

// // --- THE DEFINITIVE PHOTO UPLOAD ROUTE ---
// // We call upload.single() right here. This is the clearest and most direct way.
// router.post(
//   "/photo/:id",
//   protect,
//   authorize("admin"),
//   upload.single("profilePhoto"),
//   uploadProfilePhoto
// );

// // --- The Excel upload route (we'll keep it simple for now) ---
// const localUpload = multer({ dest: "uploads/" });
// router.post(
//   "/upload",
//   protect,
//   authorize("admin"),
//   localUpload.single("studentsFile"),
//   bulkCreateStudents
// );

// // Report Card routes
// router.post("/:id/report-card", upload.single("file"), uploadReportCard);
// router.delete(
//   "/:id/report-card",
//   protect,
//   authorize("admin", "teacher"),
//   deleteReportCard
// );

// // Class Test Report routes
// router.post("/:id/class-test-report", upload.single("file"), uploadClassTestReport);
// router.get("/:id/class-test-report", getClassTestReport);
// router.delete(
//   "/:id/class-test-report",
//   protect,
//   authorize("admin", "teacher"),
//   deleteClassTestReport
// );

// // NTSE Report routes
// router.post("/:id/ntse-report", upload.single("file"), uploadNtseReport);
// router.get("/:id/ntse-report", getNtseReport);
// router.delete(
//   "/:id/ntse-report",
//   protect,
//   authorize("admin", "teacher"),
//   deleteNtseReport
// );

// module.exports = router;

// backend/routes/studentRoutes.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  uploadProfilePhoto,
  uploadClassTestReport,
  getClassTestReport,
  deleteClassTestReport,
  uploadNtseReport,
  getNtseReport,
  deleteNtseReport,
  // NEW: Periodic Test handlers
  uploadPtReport,
  getPtReport,
  deletePtReport,
} = require("../controllers/studentController");

const { uploadReportCard } = require("../controllers/studentController");
const { deleteReportCard } = require("../controllers/studentController");

const {
  protect,
  authorize,
  canViewStudentData,
} = require("../middleware/authMiddleware");

// Import the main multer instance we just created
const upload = require("../middleware/upload");

// Standard JSON routes
router
  .route("/")
  .post(protect, authorize("admin"), createStudent)
  .get(protect, getStudents);

router
  .route("/:id")
  .get(canViewStudentData, getStudentById)
  .put(protect, authorize("admin"), updateStudent)
  .delete(protect, authorize("admin"), deleteStudent);

// --- THE DEFINITIVE PHOTO UPLOAD ROUTE ---
router.post(
  "/photo/:id",
  protect,
  authorize("admin"),
  upload.single("profilePhoto"),
  uploadProfilePhoto
);

// --- The Excel upload route (we'll keep it simple for now) ---
const localUpload = multer({ dest: "uploads/" });
router.post(
  "/upload",
  protect,
  authorize("admin"),
  localUpload.single("studentsFile"),
  bulkCreateStudents
);

// Report Card routes
router.post("/:id/report-card", upload.single("file"), uploadReportCard);
router.delete(
  "/:id/report-card",
  protect,
  authorize("admin", "teacher"),
  deleteReportCard
);

// Class Test Report routes
router.post(
  "/:id/class-test-report",
  upload.single("file"),
  uploadClassTestReport
);
router.get("/:id/class-test-report", getClassTestReport);
router.delete(
  "/:id/class-test-report",
  protect,
  authorize("admin", "teacher"),
  deleteClassTestReport
);

// NTSE Report routes
router.post("/:id/ntse-report", upload.single("file"), uploadNtseReport);
router.get("/:id/ntse-report", getNtseReport);
router.delete(
  "/:id/ntse-report",
  protect,
  authorize("admin", "teacher"),
  deleteNtseReport
);

// NEW: Periodic Test Report routes
router.post("/:id/pt-report", upload.single("file"), uploadPtReport);
router.get("/:id/pt-report", getPtReport);
router.delete(
  "/:id/pt-report",
  protect,
  authorize("admin", "teacher"),
  deletePtReport
);

module.exports = router;
