// const express = require('express');
// const router = express.Router();
// const { sendWhatsAppMessage, client } = require('../whatsappClient');
// const { MessageMedia } = require('whatsapp-web.js');

// const schoolLogoUrl = "https://static.vecteezy.com/system/resources/previews/046/006/102/non_2x/education-logo-design-template-for-school-and-organization-vector.jpg";

// const formatDate = (isoString) => {
//   if (!isoString) return 'N/A';
//   const options = { year: 'numeric', month: 'long', day: 'numeric' };
//   return new Date(isoString).toLocaleDateString(undefined, options);
// };

// // GET /api/whatsapp/status
// router.get('/status', (req, res) => {
//   if (client.info && client.info.wid) {
//     return res.json({ status: 'ready' });
//   }
//   return res.json({ status: 'not ready' });
// });

// // POST /api/whatsapp/send-report-links
// router.post('/send-report-links', async (req, res) => {
//   if (!client.info || !client.info.wid) {
//     return res.status(503).json({ message: 'WhatsApp client not ready. Please try again later.' });
//   }

//   const students = req.body.students;
//   if (!Array.isArray(students) || students.length === 0) {
//     return res.status(400).json({ message: 'Students array is required.' });
//   }

//   const results = [];

//   for (const student of students) {
//     try {
//       const caption = `Dear ${student.parentContact?.parentName || 'Parent'},\n\n` +
//         `Greetings from Aneja Kiddos School.\n\n` +
//         `We are pleased to share the report card of your child, ${student.fullName}, with the details below:\n\n` +
//         `• Grade Level: ${student.gradeLevel || 'N/A'}\n` +
//         `• Date of Birth: ${formatDate(student.dateOfBirth)}\n` +
//         `• Gender: ${student.gender || 'N/A'}\n` +
//         `• Section: ${student.section || 'N/A'}\n` +
//         `• Student ID: ${student.studentId || 'N/A'}\n\n` +
//         `You can view the full report card securely via the link below:\n\n` +
//         `${student.reportLink}\n\n` +
//         `Thank you for your continued support.\n\n` +
//         `Best regards,\nAneja Kiddos School`;

//       const media = await MessageMedia.fromUrl(schoolLogoUrl);
//       const chatId = student.parentPhone.startsWith('+') ? student.parentPhone.replace(/\D/g, '') : '91' + student.parentPhone.replace(/\D/g, '');
//       const waChatId = `${chatId}@c.us`;

//       // Send image media with caption (message text)
//       await client.sendMessage(waChatId, media, { caption });

//       results.push({ studentId: student.id, status: 'sent' });
//     } catch (error) {
//       results.push({ studentId: student.id, status: 'failed', error: error.message });
//     }
//   }

//   res.json({ results });
// });

// module.exports = router;

// -----------------

const express = require("express");
const router = express.Router();
const { sendWhatsAppMessage, client } = require("../whatsappClient");
const { MessageMedia } = require("whatsapp-web.js");

const schoolLogoUrl =
  "https://res.cloudinary.com/dityqhoqp/image/upload/v1757673591/UNMARK_LOGO_copy_1_nonp8j.png";

const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(isoString).toLocaleDateString(undefined, options);
};

// GET /api/whatsapp/status
router.get("/status", (req, res) => {
  if (client.info && client.info.wid) {
    return res.json({ status: "ready" });
  }
  return res.json({ status: "not ready" });
});

// POST /api/whatsapp/send-report-links
router.post("/send-report-links", async (req, res) => {
  if (!client.info || !client.info.wid) {
    return res
      .status(503)
      .json({ message: "WhatsApp client not ready. Please try again later." });
  }

  const students = req.body.students;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: "Students array is required." });
  }

  const results = [];

  // for (const student of students) {
  //   try {
  //     const caption = `Dear ${student.parentContact?.parentName || 'Parent'},\n\n` +
  //       `Greetings from Aneja Kiddos School.\n\n` +
  //       `We are pleased to share the report card of your child, ${student.fullName}, with the details below:\n\n` +
  //       `• Grade Level: ${student.gradeLevel || 'N/A'}\n` +
  //       `• Date of Birth: ${formatDate(student.dateOfBirth)}\n` +
  //       `• Gender: ${student.gender || 'N/A'}\n` +
  //       `• Section: ${student.section || 'N/A'}\n` +
  //       `• Student ID: ${student.studentId || 'N/A'}\n\n` +
  //       `You can view the full report card securely via the link below:\n\n` +
  //       `${student.reportLink}\n\n` +
  //       `Thank you for your continued support.\n\n` +
  //       `Best regards,\nAneja Kiddos School`;

  //     const media = await MessageMedia.fromUrl(schoolLogoUrl);
  //     const chatId = student.parentPhone.startsWith('+') ? student.parentPhone.replace(/\D/g, '') : '91' + student.parentPhone.replace(/\D/g, '');
  //     const waChatId = `${chatId}@c.us`;

  //     // Send image media with caption (message text)
  //     await client.sendMessage(waChatId, media, { caption });

  //     results.push({ studentId: student.id, status: 'sent' });
  //   } catch (error) {
  //     results.push({ studentId: student.id, status: 'failed', error: error.message });
  //   }
  // }

  for (const student of students) {
    try {
      if (!student.reportLink || !student.reportLink.startsWith("http")) {
        throw new Error(
          "Invalid or missing reportLink for student ID " + student.id
        );
      }

      // const logoMedia = await MessageMedia.fromUrl(schoolLogoUrl);
      const reportCardMedia = await MessageMedia.fromUrl(student.reportLink);

      const chatId = student.parentPhone.startsWith("+")
        ? student.parentPhone.replace(/\D/g, "")
        : "91" + student.parentPhone.replace(/\D/g, "");

      const waChatId = `${chatId}@c.us`;

      // Send school logo first (optional: with minimal caption)
      // await client.sendMessage(waChatId, logoMedia, {
      //   caption: "Aneja Kiddos School",
      // });

      // Prepare caption with report card details
      const caption =
        `Dear ${student.parentContact?.parentName || "Parent"},\n\n` +
        `Greetings from Aneja Kiddos School.\n\n` +
        `We are pleased to share the report card of your child, ${student.fullName}, with the details below:\n\n` +
        `• Grade Level: ${student.gradeLevel || "N/A"}\n` +
        `• Date of Birth: ${formatDate(student.dateOfBirth)}\n` +
        `• Gender: ${student.gender || "N/A"}\n` +
        `• Section: ${student.section || "N/A"}\n` +
        `• Student ID: ${student.studentId || "N/A"}\n\n` +
        `Thank you for your continued support.\n\n` +
        `Best regards,\nAneja Kiddos School`;

      // Send report card image with detailed caption
      await client.sendMessage(waChatId, reportCardMedia, { caption });

      results.push({ studentId: student.id, status: "sent" });
    } catch (error) {
      results.push({
        studentId: student.id,
        status: "failed",
        error: error.message,
      });
    }
  }

  res.json({ results });
});

module.exports = router;

// ----------------
