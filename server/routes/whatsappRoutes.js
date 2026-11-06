const express = require("express");
const router = express.Router();
const axios = require("axios");
const { getClient, getQrCode, getClientStatus, logoutWhatsApp, initWhatsApp } = require("../whatsappClient");

// In-memory progress store (in production, use Redis/DB)
const bulkProgressStore = new Map();

router.get("/status", (req, res) => {
  const status = getClientStatus();
  if (status === "connected") return res.json({ status: "connected" });
  if (status === "qr") return res.json({ status: "qr", qrCode: getQrCode() });
  return res.json({ status: "disconnected" });
});

// Reconnect WhatsApp client
router.post("/reconnect", async (req, res) => {
  try {
    const io = req.app.get("io");
    if (io) {
      await initWhatsApp(io);
      return res.json({ message: "WhatsApp reconnection initiated" });
    }
    res.status(500).json({ message: "Socket.io not available" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get progress for a bulk send session
router.get("/import-progress/:sessionId", (req, res) => {
  const progress = bulkProgressStore.get(req.params.sessionId);
  if (!progress) {
    return res.status(404).json({ message: "No active bulk session" });
  }
  res.json(progress);
});

// 🌟 Send report cards via WhatsApp with rate limiting & PDF download fallback 🌟
router.post("/send-report-links", async (req, res) => {
  const whatsappClient = getClient();

  if (getClientStatus() !== "connected" || !whatsappClient) {
    return res.status(503).json({ message: "WhatsApp client not connected. Please scan QR code first." });
  }

  const { students, sessionId, delayMs = 3000 } = req.body;
  if (!students || !students.length) return res.status(400).json({ message: "No students provided" });

  // Initialize progress tracking
  const sessionIdVal = sessionId || `bulk_${Date.now()}`;
  bulkProgressStore.set(sessionIdVal, {
    total: students.length,
    sent: 0,
    failed: 0,
    current: 0,
    status: "processing",
    results: [],
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Process in background so response returns immediately
  (async () => {
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const session = bulkProgressStore.get(sessionIdVal);
      if (!session) break; // Stop if session cleared

      session.current = i + 1;
      bulkProgressStore.set(sessionIdVal, session);

      try {
        const chatId = student.parentPhone.startsWith("+")
          ? student.parentPhone.replace(/\D/g, "")
          : "91" + student.parentPhone.replace(/\D/g, "");
        const waChatId = `${chatId}@s.whatsapp.net`;

        const captionText = student.message
          ? `Dear Parent,\n${student.message}\n\nStudent: ${student.fullName}\n\n-- School Team`
          : `Dear Parent,\nPlease find the attached report card for ${student.fullName}.\n\n-- School Team`;

        if (student.pdfData) {
          const pdfBuffer = Buffer.from(student.pdfData, 'base64');
          await whatsappClient.sendMessage(waChatId, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `${student.fullName}_Report.pdf`,
            caption: captionText,
          });
        } else if (student.reportLink && student.reportLink.trim() !== "") {
          try {
            const pdfBuffer = await downloadFile(student.reportLink);
            const ext = student.reportLink.split(".").pop().toLowerCase();

            if (["jpg", "jpeg", "png"].includes(ext)) {
              await whatsappClient.sendMessage(waChatId, {
                image: pdfBuffer,
                caption: captionText,
              });
            } else {
              await whatsappClient.sendMessage(waChatId, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `${student.fullName}_Report.pdf`,
                caption: captionText,
              });
            }
          } catch (downloadErr) {
            await whatsappClient.sendMessage(waChatId, {
              document: { url: student.reportLink },
              mimetype: 'application/pdf',
              fileName: `${student.fullName}_Report.pdf`,
              caption: captionText,
            });
          }
        } else {
          await whatsappClient.sendMessage(waChatId, {
            text: `Hello ${student.parentName || "Parent"},\n\nThe report card for ${student.fullName} is not available yet. Please contact the school office.\n\n-- School Team`,
          });
        }

        session.sent++;
      } catch (error) {
        session.failed++;
        results.push({
          studentId: student.id,
          studentName: student.fullName,
          status: "failed",
          error: error.message || "Connection Closed",
        });
      }

      session.results.push({
        studentId: student.id,
        studentName: student.fullName,
        status: results[results.length - 1]?.status || "sent",
      });

      bulkProgressStore.set(sessionIdVal, session);

      // Rate limit between messages
      if (i < students.length - 1) {
        await delay(delayMs);
      }
    }

    session.status = "completed";
    bulkProgressStore.set(sessionIdVal, session);
  })();

  // Return immediately with session ID for progress tracking
  res.json({
    message: "Bulk send started",
    sessionId: sessionIdVal,
    total: students.length,
  });
});

async function downloadFile(fileUrl) {
  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

module.exports = router;
