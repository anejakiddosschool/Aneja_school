
// const xlsx = require("xlsx");
// const fs = require("fs");
// const Student = require("../models/Student");
// const Grade = require("../models/Grade");
// const { cloudinary } = require("../config/cloudinary");

// // --- HELPER FUNCTIONS ---
// const capitalizeName = (name) => {
//   if (!name || typeof name !== "string") return "";
//   return name
//     .split(" ")
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//     .join(" ");
// };

// const getMiddleName = (fullName) => {
//   if (!fullName || typeof fullName !== "string") return "User";
//   const names = fullName.trim().split(/\s+/);
//   if (names.length > 2)
//     return names[1].charAt(0).toUpperCase() + names[1].slice(1).toLowerCase();
//   if (names.length === 2)
//     return names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase();
//   return names[0] || "User";
// };

// // --- CONTROLLER FUNCTIONS ---

// // @desc    Get all students, sorted
// // @route   GET /api/students
// exports.getStudents = async (req, res) => {
//   try {
//     const students = await Student.find({}).sort({
//       gradeLevel: 1,
//       fullName: 1,
//     });
//     res.json({ success: true, count: students.length, data: students });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // @desc    Get single student by ID with calculated data
// // @route   GET /api/students/:id
// exports.getStudentById = async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id);
//     if (!student) return res.status(404).json({ message: "Student not found" });

//     const grades = await Grade.find({ student: student._id });
//     let promotionStatus = "To Be Determined";
//     let overallAverage = 0;

//     if (grades.length > 0) {
//       const totalScore = grades.reduce(
//         (sum, grade) => sum + (grade.finalScore || 0),
//         0
//       );
//       overallAverage = totalScore / grades.length;
//       if (overallAverage >= 50) promotionStatus = "Promoted";
//       else promotionStatus = "Not Promoted";
//     }

//     const studentObject = student.toObject();
//     studentObject.promotionStatus = promotionStatus;
//     studentObject.overallAverage = overallAverage;

//     res.json({ success: true, data: studentObject });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// exports.createStudent = async (req, res) => {
//   // Student ID = AKS-YYYYMMDD-XXX (unique per DOB + sequence).
//   // Password = MiddleName@YearOfBirth.

//   const {
//     fullName,
//     gender,
//     dateOfBirth,
//     parentContact,
//     gradeLevel,
//     section,
//     rollNumber,
//     motherName,
//     address,
//     adhaarNumber,
//   } = req.body;

//   try {
//     const capitalizedFullName = capitalizeName(fullName);

//     // Extract DOB parts
//     const dob = new Date(dateOfBirth);
//     const dobString = dob.toISOString().split("T")[0].replace(/-/g, ""); // e.g. 20100115

//     // Find last student with same DOB prefix
//     const lastStudent = await Student.findOne({
//       studentId: new RegExp(`^AKS-${dobString}`),
//     }).sort({ studentId: -1 });

//     let lastSequence = lastStudent
//       ? parseInt(lastStudent.studentId.split("-")[2], 10)
//       : 0;

//     // New ID format -> AKS-YYYYMMDD-XXX
//     const newStudentId = `AKS-${dobString}-${String(lastSequence + 1).padStart(
//       3,
//       "0"
//     )}`;

//     // Create password using middle name + year of birth
//     const middleName = getMiddleName(capitalizedFullName);
//     const yearOfBirth = dob.getFullYear();
//     const initialPassword = `${middleName}@${yearOfBirth}`;

//     const student = new Student({
//       studentId: newStudentId,
//       fullName: capitalizedFullName,
//       gender,
//       dateOfBirth,
//       gradeLevel,
//       password: initialPassword,
//       parentContact,
//       section,
//       rollNumber,
//       motherName,
//       address,
//       adhaarNumber,
//     });

//     await student.save();

//     const responseData = student.toObject();
//     responseData.initialPassword = initialPassword;
//     delete responseData.password;

//     res.status(201).json({ success: true, data: responseData });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({
//         message: "A student with this ID already exists.",
//       });
//     }
//     res.status(500).json({ message: "Server Error", details: error.message });
//   }
// };

// // @desc    Update a student's profile
// // @route   PUT /api/students/:id
// exports.updateStudent = async (req, res) => {
//   try {
//     const { fullName, ...otherData } = req.body;
//     const updateData = { ...otherData };
//     if (fullName) {
//       updateData.fullName = capitalizeName(fullName);
//     }

//     const updatedStudent = await Student.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     );
//     if (!updatedStudent)
//       return res.status(404).json({ message: "Student not found." });

//     res.json({ success: true, data: updatedStudent });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", details: error.message });
//   }
// };

// // @desc    Delete a student
// // @route   DELETE /api/students/:id
// exports.deleteStudent = async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id);
//     if (!student) return res.status(404).json({ message: "Student not found" });
//     await student.deleteOne();
//     res.json({ success: true, message: "Student deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // @desc    Upload student profile photo to Cloudinary
// // @route   POST /api/students/:id/photo
// exports.uploadProfilePhoto = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file was uploaded." });
//     }

//     const student = await Student.findById(req.params.id);
//     if (!student) {
//       return res.status(404).json({ message: "Student not found." });
//     }

//     // Optional: Remove old image from Cloudinary if you track public_id
//     // if (student.imagePublicId) {
//     //     await cloudinary.uploader.destroy(student.imagePublicId);
//     // }

//     // If req.file.path is already a Cloudinary URL (eg. multer-storage-cloudinary),
//     // use it directly. Otherwise, upload local file to Cloudinary.
//     if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
//       student.imageUrl = req.file.path;
//       student.imagePublicId = req.file.filename || req.file.public_id || "";
//     } else {
//       // upload local file
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "student_photos",
//       });
//       student.imageUrl = result.secure_url;
//       student.imagePublicId = result.public_id;
//       // remove local
//       try {
//         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
//       } catch (e) {
//         console.warn("Failed to unlink temp file:", e.message);
//       }
//     }

//     await student.save({ validateBeforeSave: false });

//     res.status(200).json({
//       message: "Profile photo updated successfully",
//       imageUrl: student.imageUrl,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error uploading photo",
//       details: error.message,
//     });
//   }
// };

// // @desc Upload Report Card Image to Cloudinary
// // @route POST /api/students/:id/report-card
// exports.uploadReportCard = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file was uploaded." });
//     }

//     const student = await Student.findById(req.params.id);
//     if (!student) {
//       return res.status(404).json({ message: "Student not found." });
//     }

//     // If req.file.path is already a Cloudinary URL (e.g. using multer-storage-cloudinary)
//     // then we simply save that url and filename/public_id.
//     if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
//       student.reportCardUrl = req.file.path;
//       student.reportCardPublicId =
//         req.file.filename || req.file.public_id || "";
//     } else {
//       // Otherwise upload the local file to Cloudinary and then unlink local file
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "report_cards",
//       });
//       student.reportCardUrl = result.secure_url;
//       student.reportCardPublicId = result.public_id;
//       try {
//         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
//       } catch (e) {
//         console.warn("Failed to unlink temp file:", e.message);
//       }
//     }

//     await student.save({ validateBeforeSave: false });

//     res.status(200).json({
//       message: "Report card uploaded successfully",
//       reportCardUrl: student.reportCardUrl,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error uploading report card",
//       details: error.message,
//     });
//   }
// };

// exports.deleteReportCard = async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id);
//     if (!student)
//       return res.status(404).json({ message: "Student not found." });

//     if (!student.reportCardPublicId) {
//       return res.status(400).json({ message: "No report card to delete." });
//     }

//     // Delete image from Cloudinary using stored public_id
//     try {
//       await cloudinary.uploader.destroy(student.reportCardPublicId);
//     } catch (e) {
//       console.warn("Cloudinary destroy failed:", e.message);
//       // continue and remove references anyway
//     }

//     // Remove image references from student document
//     student.reportCardUrl = null;
//     student.reportCardPublicId = null;
//     await student.save();

//     return res.json({
//       success: true,
//       message: "Report card deleted successfully.",
//     });
//   } catch (error) {
//     console.error("Cloudinary deletion error:", error);
//     res.status(500).json({ message: "Failed to delete report card." });
//   }
// };

// exports.bulkCreateStudents = async (req, res) => {
//   if (!req.file) return res.status(400).json({ message: "No file uploaded." });
//   const filePath = req.file.path;

//   try {
//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];

//     // CRITICAL FIX: Use cellDates: true to parse dates correctly
//     const studentsJson = xlsx.utils.sheet_to_json(worksheet, {
//       cellDates: true,
//     });

//     if (studentsJson.length === 0) {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({ message: "The Excel file is empty." });
//     }

//     const createdStudentsForResponse = [];

//     for (const studentRow of studentsJson) {
//       const fullName = studentRow["Full Name"] || studentRow["fullName"];
//       const capitalizedFullName = capitalizeName(fullName);

//       // Get the date - it should now be a proper Date object
//       let dob = studentRow["Date of Birth"] || studentRow["dateOfBirth"];

//       // Additional safety check: if it's still a number, convert it manually
//       if (typeof dob === "number") {
//         // Excel date conversion: Excel epoch (1900-01-01) to Unix epoch (1970-01-01)
//         dob = new Date((dob - 25569) * 86400 * 1000);
//       } else if (typeof dob === "string") {
//         dob = new Date(dob);
//       }

//       // Validate the date
//       if (!(dob instanceof Date) || isNaN(dob.getTime())) {
//         throw new Error(`Invalid date format for student: ${fullName}`);
//       }

//       const dobString = dob.toISOString().split("T")[0].replace(/-/g, "");
//       const yearOfBirth = dob.getFullYear();

//       const lastStudent = await Student.findOne({
//         studentId: new RegExp(`^AKS-${dobString}`),
//       }).sort({ studentId: -1 });

//       const lastSequence = lastStudent
//         ? parseInt(lastStudent.studentId.split("-")[2], 10)
//         : 0;

//       const newStudentId = `AKS-${dobString}-${String(
//         lastSequence + 1
//       ).padStart(3, "0")}`;
//       const middleName = getMiddleName(capitalizedFullName);
//       const initialPassword = `${middleName}@${yearOfBirth}`;

//       const studentData = {
//         studentId: newStudentId,
//         fullName: capitalizedFullName,
//         gender: studentRow["Gender"] || studentRow["gender"],
//         dateOfBirth: dob,
//         gradeLevel: studentRow["Grade Level"] || studentRow["gradeLevel"],
//         password: initialPassword,
//         parentContact: {
//           parentName: studentRow["Parent Name"],
//           phone: studentRow["Parent Phone"],
//         },
//         section: studentRow["Section"],
//         rollNumber: studentRow["Roll No"] || studentRow["rollNumber"],
//         motherName: studentRow["Mother's Name"] || studentRow["motherName"],
//         address: studentRow["Address"] || studentRow["address"],
//         adhaarNumber: studentRow["Aadhaar Card Number"] || studentRow["address"],
//       };

//       const newStudent = new Student(studentData);
//       await newStudent.save();

//       const responseData = newStudent.toObject();
//       responseData.initialPassword = initialPassword;
//       delete responseData.password;
//       createdStudentsForResponse.push(responseData);
//     }

//     fs.unlinkSync(filePath);

//     res.status(201).json({
//       message: `${createdStudentsForResponse.length} students imported successfully.`,
//       data: createdStudentsForResponse,
//     });
//   } catch (error) {
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//     if (
//       error.code === 11000 ||
//       error.name === "MongoBulkWriteError" ||
//       error.name === "ValidationError"
//     ) {
//       return res.status(400).json({
//         message:
//           "Import failed. Students may already exist or have invalid data.",
//       });
//     }
//     console.error("Bulk import error:", error);
//     res.status(500).json({
//       message: "An error occurred during the import process.",
//       details: error.message,
//     });
//   }
// };


// // // @route POST /api/students/:id/class-test-report
// // exports.uploadClassTestReport = async (req, res) => {
// //   try {
// //     const studentId = req.params.id;

// //     if (!req.file) {
// //       return res.status(400).json({ success: false, message: "No file uploaded" });
// //     }

// //     // Find student early
// //     const student = await Student.findById(studentId);
// //     if (!student) {
// //       // if we uploaded to disk, try to unlink local temp file
// //       try {
// //         if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// //       } catch (e) {
// //         // ignore unlink errors
// //       }
// //       return res.status(404).json({ success: false, message: "Student not found" });
// //     }

// //     let secureUrl = null;
// //     let publicId = null;

// //     // If req.file.path looks like a URL, assume uploader already uploaded to Cloudinary (multer-storage-cloudinary)
// //     if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
// //       secureUrl = req.file.path;
// //       publicId = req.file.filename || req.file.public_id || "";
// //     } else {
// //       // Otherwise upload the local temp file to Cloudinary
// //       const result = await cloudinary.uploader.upload(req.file.path, {
// //         folder: "class_test_reports",
// //       });
// //       secureUrl = result.secure_url;
// //       publicId = result.public_id;

// //       // remove local temp file
// //       try {
// //         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// //       } catch (e) {
// //         console.warn("Failed to unlink temp file:", e.message);
// //       }
// //     }

// //     // Save to student schema
// //     // If your Student schema has an array named classTestReports, push into it.
// //     if (Array.isArray(student.classTestReports)) {
// //       student.classTestReports.push({
// //         url: secureUrl,
// //         public_id: publicId,
// //         uploadedAt: new Date(),
// //       });
// //     } else {
// //       // Backwards-compatible: store to singular fields if array doesn't exist
// //       // Note: your schema has reportClasstestUrl and reportClasstestPublicId (spelling kept as in your schema)
// //       student.reportClasstestUrl = secureUrl;
// //       student.reportClasstestPublicId = publicId;
// //     }

// //     await student.save({ validateBeforeSave: false });

// //     return res.json({
// //       success: true,
// //       message: "Class test report uploaded successfully",
// //       data: Array.isArray(student.classTestReports) ? student.classTestReports : { url: secureUrl, public_id: publicId },
// //     });
// //   } catch (error) {
// //     console.error("Error uploading class test report:", error);
// //     res.status(500).json({ success: false, message: "Server error", details: error.message });
// //   }
// // };

// // // ---------------- GET CLASS TEST REPORTS ----------------
// // // @route GET /api/students/:id/class-test-reports
// // exports.getClassTestReports = async (req, res) => {
// //   try {
// //     const student = await Student.findById(req.params.id);

// //     if (!student) {
// //       return res.status(404).json({ success: false, message: "Student not found" });
// //     }

// //     // If schema has array, return that. Else return singular fields if present.
// //     if (Array.isArray(student.classTestReports)) {
// //       return res.json({
// //         success: true,
// //         data: student.classTestReports,
// //       });
// //     }

// //     const single = [];
// //     if (student.reportClasstestUrl) {
// //       single.push({
// //         url: student.reportClasstestUrl,
// //         public_id: student.reportClasstestPublicId || "",
// //         uploadedAt: student.updatedAt || student.createdAt || new Date(),
// //       });
// //     }

// //     return res.json({
// //       success: true,
// //       data: single,
// //     });
// //   } catch (error) {
// //     console.error("Error fetching class test reports:", error);
// //     res.status(500).json({ success: false, message: "Server error", details: error.message });
// //   }
// // };

// // @route POST /api/students/:id/class-test-report
// exports.uploadClassTestReport = async (req, res) => {
//   try {
//     const studentId = req.params.id;

//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No file uploaded" });
//     }

//     const student = await Student.findById(studentId);
//     if (!student) {
//       try {
//         if (req.file.path && fs.existsSync(req.file.path))
//           fs.unlinkSync(req.file.path);
//       } catch (e) {}
//       return res
//         .status(404)
//         .json({ success: false, message: "Student not found" });
//     }

//     let secureUrl = null;
//     let publicId = null;

//     if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
//       secureUrl = req.file.path;
//       publicId = req.file.filename || req.file.public_id || "";
//     } else {
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "class_test_reports",
//       });
//       secureUrl = result.secure_url;
//       publicId = result.public_id;

//       try {
//         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
//       } catch (e) {}
//     }

//     // Directly set the string fields
//     student.reportClassTestUrl = secureUrl;
//     student.reportClassTestPublicId = publicId;

//     await student.save({ validateBeforeSave: false });

//     return res.json({
//       success: true,
//       message: "Class test report uploaded successfully",
//       data: { url: secureUrl, public_id: publicId },
//     });
//   } catch (error) {
//     console.error("Error uploading class test report:", error);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Server error",
//         details: error.message,
//       });
//   }
// };

// // @route GET /api/students/:id/class-test-report
// exports.getClassTestReport = async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id);

//     if (!student) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Student not found" });
//     }

//     if (student.reportClassTestUrl) {
//       return res.json({
//         success: true,
//         data: [
//           {
//             url: student.reportClassTestUrl,
//             public_id: student.reportClassTestPublicId || "",
//             uploadedAt: student.updatedAt || student.createdAt || new Date(),
//           },
//         ],
//       });
//     } else {
//       return res.json({ success: true, data: [] });
//     }
//   } catch (error) {
//     console.error("Error fetching class test report:", error);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Server error",
//         details: error.message,
//       });
//   }
// };

// // @route DELETE /api/students/:id/class-test-report
// exports.deleteClassTestReport = async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id);

//     if (!student) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Student not found" });
//     }

//     if (!student.reportClassTestPublicId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No class test report to delete." });
//     }

//     // Remove file from Cloudinary
//     await cloudinary.uploader.destroy(student.reportClassTestPublicId);

//     student.reportClassTestUrl = "";
//     student.reportClassTestPublicId = "";

//     await student.save();

//     res.json({
//       success: true,
//       message: "Class test report deleted successfully.",
//     });
//   } catch (error) {
//     console.error("Error deleting class test report:", error);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Server error",
//         details: error.message,
//       });
//   }
// };



const xlsx = require("xlsx");
const fs = require("fs");
const Student = require("../models/Student");
const Grade = require("../models/Grade");
const { cloudinary } = require("../config/cloudinary");

// --- HELPER FUNCTIONS ---
const capitalizeName = (name) => {
  if (!name || typeof name !== "string") return "";
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getMiddleName = (fullName) => {
  if (!fullName || typeof fullName !== "string") return "User";
  const names = fullName.trim().split(/\s+/);
  if (names.length > 2)
    return names[1].charAt(0).toUpperCase() + names[1].slice(1).toLowerCase();
  if (names.length === 2)
    return names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase();
  return names[0] || "User";
};

// --- CONTROLLER FUNCTIONS ---

// @desc    Get all students, sorted
// @route   GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({}).sort({
      gradeLevel: 1,
      fullName: 1,
    });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get single student by ID with calculated data
// @route   GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const grades = await Grade.find({ student: student._id });
    let promotionStatus = "To Be Determined";
    let overallAverage = 0;

    if (grades.length > 0) {
      const totalScore = grades.reduce(
        (sum, grade) => sum + (grade.finalScore || 0),
        0
      );
      overallAverage = totalScore / grades.length;
      if (overallAverage >= 50) promotionStatus = "Promoted";
      else promotionStatus = "Not Promoted";
    }

    const studentObject = student.toObject();
    studentObject.promotionStatus = promotionStatus;
    studentObject.overallAverage = overallAverage;

    res.json({ success: true, data: studentObject });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.createStudent = async (req, res) => {
  const {
    fullName,
    gender,
    dateOfBirth,
    parentContact,
    gradeLevel,
    section,
    rollNumber,
    motherName,
    address,
    adhaarNumber,
  } = req.body;

  try {
    const capitalizedFullName = capitalizeName(fullName);

    const dob = new Date(dateOfBirth);
    const dobString = dob.toISOString().split("T")[0].replace(/-/g, "");

    const lastStudent = await Student.findOne({
      studentId: new RegExp(`^AKS-${dobString}`),
    }).sort({ studentId: -1 });

    let lastSequence = lastStudent
      ? parseInt(lastStudent.studentId.split("-")[2], 10)
      : 0;

    const newStudentId = `AKS-${dobString}-${String(lastSequence + 1).padStart(
      3,
      "0"
    )}`;

    const middleName = getMiddleName(capitalizedFullName);
    const yearOfBirth = dob.getFullYear();
    const initialPassword = `${middleName}@${yearOfBirth}`;

    const student = new Student({
      studentId: newStudentId,
      fullName: capitalizedFullName,
      gender,
      dateOfBirth,
      gradeLevel,
      password: initialPassword,
      parentContact,
      section,
      rollNumber,
      motherName,
      address,
      adhaarNumber,
    });

    await student.save();

    const responseData = student.toObject();
    responseData.initialPassword = initialPassword;
    delete responseData.password;

    res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A student with this ID already exists.",
      });
    }
    res.status(500).json({ message: "Server Error", details: error.message });
  }
};

// @desc    Update a student's profile
// @route   PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const { fullName, ...otherData } = req.body;
    const updateData = { ...otherData };
    if (fullName) {
      updateData.fullName = capitalizeName(fullName);
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedStudent)
      return res.status(404).json({ message: "Student not found." });

    res.json({ success: true, data: updatedStudent });
  } catch (error) {
    res.status(500).json({ message: "Server Error", details: error.message });
  }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    await student.deleteOne();
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Upload student profile photo to Cloudinary
// @route   POST /api/students/:id/photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded." });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
      student.imageUrl = req.file.path;
      student.imagePublicId = req.file.filename || req.file.public_id || "";
    } else {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "student_photos",
      });
      student.imageUrl = result.secure_url;
      student.imagePublicId = result.public_id;
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn("Failed to unlink temp file:", e.message);
      }
    }

    await student.save({ validateBeforeSave: false });

    res.status(200).json({
      message: "Profile photo updated successfully",
      imageUrl: student.imageUrl,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error uploading photo",
      details: error.message,
    });
  }
};

// @desc Upload Report Card Image to Cloudinary
// @route POST /api/students/:id/report-card
exports.uploadReportCard = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded." });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
      student.reportCardUrl = req.file.path;
      student.reportCardPublicId =
        req.file.filename || req.file.public_id || "";
    } else {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "report_cards",
      });
      student.reportCardUrl = result.secure_url;
      student.reportCardPublicId = result.public_id;
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn("Failed to unlink temp file:", e.message);
      }
    }

    await student.save({ validateBeforeSave: false });

    res.status(200).json({
      message: "Report card uploaded successfully",
      reportCardUrl: student.reportCardUrl,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error uploading report card",
      details: error.message,
    });
  }
};

exports.deleteReportCard = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Student not found." });

    if (!student.reportCardPublicId) {
      return res.status(400).json({ message: "No report card to delete." });
    }

    try {
      await cloudinary.uploader.destroy(student.reportCardPublicId);
    } catch (e) {
      console.warn("Cloudinary destroy failed:", e.message);
    }

    student.reportCardUrl = null;
    student.reportCardPublicId = null;
    await student.save();

    return res.json({
      success: true,
      message: "Report card deleted successfully.",
    });
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    res.status(500).json({ message: "Failed to delete report card." });
  }
};

exports.bulkCreateStudents = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });
  const filePath = req.file.path;

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const studentsJson = xlsx.utils.sheet_to_json(worksheet, {
      cellDates: true,
    });

    if (studentsJson.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "The Excel file is empty." });
    }

    const createdStudentsForResponse = [];

    for (const studentRow of studentsJson) {
      const fullName = studentRow["Full Name"] || studentRow["fullName"];
      const capitalizedFullName = capitalizeName(fullName);

      let dob = studentRow["Date of Birth"] || studentRow["dateOfBirth"];

      if (typeof dob === "number") {
        dob = new Date((dob - 25569) * 86400 * 1000);
      } else if (typeof dob === "string") {
        dob = new Date(dob);
      }

      if (!(dob instanceof Date) || isNaN(dob.getTime())) {
        throw new Error(`Invalid date format for student: ${fullName}`);
      }

      const dobString = dob.toISOString().split("T")[0].replace(/-/g, "");
      const yearOfBirth = dob.getFullYear();

      const lastStudent = await Student.findOne({
        studentId: new RegExp(`^AKS-${dobString}`),
      }).sort({ studentId: -1 });

      const lastSequence = lastStudent
        ? parseInt(lastStudent.studentId.split("-")[2], 10)
        : 0;

      const newStudentId = `AKS-${dobString}-${String(
        lastSequence + 1
      ).padStart(3, "0")}`;
      const middleName = getMiddleName(capitalizedFullName);
      const initialPassword = `${middleName}@${yearOfBirth}`;

      const studentData = {
        studentId: newStudentId,
        fullName: capitalizedFullName,
        gender: studentRow["Gender"] || studentRow["gender"],
        dateOfBirth: dob,
        gradeLevel: studentRow["Grade Level"] || studentRow["gradeLevel"],
        password: initialPassword,
        parentContact: {
          parentName: studentRow["Parent Name"],
          phone: studentRow["Parent Phone"],
        },
        section: studentRow["Section"],
        rollNumber: studentRow["Roll No"] || studentRow["rollNumber"],
        motherName: studentRow["Mother's Name"] || studentRow["motherName"],
        address: studentRow["Address"] || studentRow["address"],
        adhaarNumber:
          studentRow["Aadhaar Card Number"] || studentRow["address"],
      };

      const newStudent = new Student(studentData);
      await newStudent.save();

      const responseData = newStudent.toObject();
      responseData.initialPassword = initialPassword;
      delete responseData.password;
      createdStudentsForResponse.push(responseData);
    }

    fs.unlinkSync(filePath);

    res.status(201).json({
      message: `${createdStudentsForResponse.length} students imported successfully.`,
      data: createdStudentsForResponse,
    });
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (
      error.code === 11000 ||
      error.name === "MongoBulkWriteError" ||
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Import failed. Students may already exist or have invalid data.",
      });
    }
    console.error("Bulk import error:", error);
    res.status(500).json({
      message: "An error occurred during the import process.",
      details: error.message,
    });
  }
};

// @route POST /api/students/:id/class-test-report
exports.uploadClassTestReport = async (req, res) => {
  try {
    const studentId = req.params.id;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      try {
        if (req.file.path && fs.existsSync(req.file.path))
          fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    let secureUrl = null;
    let publicId = null;

    if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
      secureUrl = req.file.path;
      publicId = req.file.filename || req.file.public_id || "";
    } else {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "class_test_reports",
      });
      secureUrl = result.secure_url;
      publicId = result.public_id;

      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
    }

    student.reportClassTestUrl = secureUrl;
    student.reportClassTestPublicId = publicId;

    await student.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: "Class test report uploaded successfully",
      data: { url: secureUrl, public_id: publicId },
    });
  } catch (error) {
    console.error("Error uploading class test report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};

// @route GET /api/students/:id/class-test-report
exports.getClassTestReport = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (student.reportClassTestUrl) {
      return res.json({
        success: true,
        data: [
          {
            url: student.reportClassTestUrl,
            public_id: student.reportClassTestPublicId || "",
            uploadedAt: student.updatedAt || student.createdAt || new Date(),
          },
        ],
      });
    } else {
      return res.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error("Error fetching class test report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};

// @route DELETE /api/students/:id/class-test-report
exports.deleteClassTestReport = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (!student.reportClassTestPublicId) {
      return res.status(400).json({
        success: false,
        message: "No class test report to delete.",
      });
    }

    await cloudinary.uploader.destroy(student.reportClassTestPublicId);

    student.reportClassTestUrl = "";
    student.reportClassTestPublicId = "";

    await student.save();

    res.json({
      success: true,
      message: "Class test report deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting class test report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};

// ================= NTSE REPORT HANDLERS =================

// @route POST /api/students/:id/ntse-report
exports.uploadNtseReport = async (req, res) => {
  try {
    const studentId = req.params.id;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      try {
        if (req.file.path && fs.existsSync(req.file.path))
          fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    let secureUrl = null;
    let publicId = null;

    if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
      secureUrl = req.file.path;
      publicId = req.file.filename || req.file.public_id || "";
    } else {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "ntse_reports",
      });
      secureUrl = result.secure_url;
      publicId = result.public_id;

      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
    }

    student.reportNTSEUrl = secureUrl;
    student.reportNTSEPublicId = publicId;

    await student.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: "NTSE report uploaded successfully",
      data: { url: secureUrl, public_id: publicId },
    });
  } catch (error) {
    console.error("Error uploading NTSE report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};

// @route GET /api/students/:id/ntse-report
exports.getNtseReport = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (student.reportNTSEUrl) {
      return res.json({
        success: true,
        data: [
          {
            url: student.reportNTSEUrl,
            public_id: student.reportNTSEPublicId || "",
            uploadedAt: student.updatedAt || student.createdAt || new Date(),
          },
        ],
      });
    } else {
      return res.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error("Error fetching NTSE report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};

// @route DELETE /api/students/:id/ntse-report
exports.deleteNtseReport = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (!student.reportNTSEPublicId) {
      return res.status(400).json({
        success: false,
        message: "No NTSE report to delete.",
      });
    }

    await cloudinary.uploader.destroy(student.reportNTSEPublicId);

    student.reportNTSEUrl = "";
    student.reportNTSEPublicId = "";

    await student.save();

    res.json({
      success: true,
      message: "NTSE report deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting NTSE report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};
