// const express = require("express");
// const router = express.Router();
// const { sendWhatsAppMessage, client } = require("../whatsappClient");
// const { MessageMedia } = require("whatsapp-web.js");

// const schoolLogoUrl =
//   "https://res.cloudinary.com/dityqhoqp/image/upload/v1757673591/UNMARK_LOGO_copy_1_nonp8j.png";

// const formatDate = (isoString) => {
//   if (!isoString) return "N/A";
//   const options = { year: "numeric", month: "long", day: "numeric" };
//   return new Date(isoString).toLocaleDateString(undefined, options);
// };

// // GET /api/whatsapp/status
// router.get("/status", (req, res) => {
//   if (client.info && client.info.wid) {
//     return res.json({ status: "ready" });
//   }
//   return res.json({ status: "not ready" });
// });

// router.post("/send-report-links", async (req, res) => {
//   if (!client.info || !client.info.wid) {
//     return res
//       .status(503)
//       .json({ message: "WhatsApp client not ready. Please try again later." });
//   }

//   const students = req.body.students;
//   if (!Array.isArray(students) || students.length === 0) {
//     return res.status(400).json({ message: "Students array is required." });
//   }

//   const results = [];

//   for (const student of students) {
//     try {
//       if (!student.reportLink || !student.reportLink.startsWith("http")) {
//         throw new Error(
//           "Invalid or missing reportLink for student ID " + student.id
//         );
//       }

//       const reportCardMedia = await MessageMedia.fromUrl(student.reportLink);

//       const chatId = student.parentPhone.startsWith("+")
//         ? student.parentPhone.replace(/\D/g, "")
//         : "91" + student.parentPhone.replace(/\D/g, "");

//       const waChatId = `${chatId}@c.us`;

//       // Build caption dynamically per report type
//       const isClassTest = student.reportType === "classTest";

//       const caption =
//         `Dear ${student.parentContact?.parentName || "Parent"},\n\n` +
//         `Greetings from Aneja Kiddos School.\n\n` +
//         `We are pleased to share the ${
//           isClassTest ? "class test report" : "report card"
//         } of your child, ${student.fullName}, with the details below:\n\n` +
//         `• Grade Level: ${student.gradeLevel || "N/A"}\n` +
//         `• Date of Birth: ${formatDate(student.dateOfBirth)}\n` +
//         `• Gender: ${student.gender || "N/A"}\n` +
//         `• Section: ${student.section || "N/A"}\n` +
//         `• Student ID: ${student.studentId || "N/A"}\n\n` +
//         `Thank you for your continued support.\n\n` +
//         `Best regards,\nAneja Kiddos School`;

//       await client.sendMessage(waChatId, reportCardMedia, { caption });

//       results.push({ studentId: student.id, status: "sent" });
//     } catch (error) {
//       results.push({
//         studentId: student.id,
//         status: "failed",
//         error: error.message,
//       });
//     }
//   }

//   res.json({ results });
// });

// module.exports = router;

// // ----------------


const express = require("express");
const router = express.Router();
const { client, sendWhatsAppMessage, getQrCode } = require("../whatsappClient");
const { MessageMedia } = require("whatsapp-web.js");

// GET /api/whatsapp/qr → return current QR code to frontend
router.get("/qr", (req, res) => {
  const qr = getQrCode();
  if (!qr) return res.status(404).json({ message: "QR code not generated yet" });
  res.json({ qr });
});

// GET /api/whatsapp/status → check if WhatsApp client is ready
router.get("/status", (req, res) => {
  if (client.info && client.info.wid) {
    return res.json({ status: "ready" });
  }
  return res.json({ status: "not ready" });
});

// POST /api/whatsapp/send-report-links → existing report sending logic
router.post("/send-report-links", async (req, res) => {
  if (!client.info || !client.info.wid) {
    return res.status(503).json({ message: "WhatsApp client not ready. Please try again later." });
  }

  const students = req.body.students;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: "Students array is required." });
  }

  const results = [];

  for (const student of students) {
    try {
      if (!student.reportLink || !student.reportLink.startsWith("http")) {
        throw new Error("Invalid or missing reportLink for student ID " + student.id);
      }

      const reportCardMedia = await MessageMedia.fromUrl(student.reportLink);

      const chatId = student.parentPhone.startsWith("+")
        ? student.parentPhone.replace(/\D/g, "")
        : "91" + student.parentPhone.replace(/\D/g, "");
      const waChatId = `${chatId}@c.us`;

      const isClassTest = student.reportType === "classTest";

      const caption =
        `Dear ${student.parentContact?.parentName || "Parent"},\n\n` +
        `Greetings from Aneja Kiddos School.\n\n` +
        `We are pleased to share the ${isClassTest ? "class test report" : "report card"} of your child, ${student.fullName}, with the details below:\n\n` +
        `• Grade Level: ${student.gradeLevel || "N/A"}\n` +
        `• Date of Birth: ${student.dateOfBirth || "N/A"}\n` +
        `• Gender: ${student.gender || "N/A"}\n` +
        `• Section: ${student.section || "N/A"}\n` +
        `• Student ID: ${student.studentId || "N/A"}\n\n` +
        `Thank you for your continued support.\n\n` +
        `Best regards,\nAneja Kiddos School`;

      await client.sendMessage(waChatId, reportCardMedia, { caption });

      results.push({ studentId: student.id, status: "sent" });
    } catch (error) {
      results.push({ studentId: student.id, status: "failed", error: error.message });
    }
  }

  res.json({ results });
});

module.exports = router;
