const express = require("express");
const router = express.Router();
// 🌟 Yahan dhyan do, "client" hata kar "getClient" likha hai 🌟
const { getClient, getQrCode, getClientStatus, logoutWhatsApp } = require("../whatsappClient");

router.get("/status", (req, res) => {
  const status = getClientStatus();
  if (status === "connected") return res.json({ status: "connected" });
  if (status === "qr") return res.json({ status: "qr", qrCode: getQrCode() });
  return res.json({ status: "disconnected" });
});

router.post("/logout", async (req, res) => {
  try {
    await logoutWhatsApp();
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to logout" });
  }
});

// 🌟 THE FIX FOR REPORTS AND NTSE TESTS 🌟
router.post("/send-report-links", async (req, res) => {
  const whatsappClient = getClient(); // Latest connected client le lo

  // Check agar connected nahi hai YA client undefined hai
  if (getClientStatus() !== "connected" || !whatsappClient) {
    return res.status(503).json({ message: "WhatsApp client not ready." });
  }
  
  const { students } = req.body;
  if (!students || !students.length) return res.status(400).json({ message: "No students provided" });

  const results = [];
  
  for (const student of students) {
    try {
      const chatId = student.parentPhone.startsWith("+") 
          ? student.parentPhone.replace(/\D/g, "") 
          : "91" + student.parentPhone.replace(/\D/g, "");
      const waChatId = `${chatId}@s.whatsapp.net`;
      
      const captionText = student.message || `Dear Parent,\nPlease find the attached report for ${student.fullName}.`;
      
      const ext = (student.reportLink || "").split('.').pop().toLowerCase();
      let messagePayload;

      // URL to Baileys Document format mapping
      if (['jpg', 'jpeg', 'png'].includes(ext)) {
          messagePayload = { 
              image: { url: student.reportLink }, 
              caption: captionText 
          };
      } else {
          messagePayload = { 
              document: { url: student.reportLink }, 
              mimetype: 'application/pdf', 
              fileName: `${student.fullName}_Report.pdf`, 
              caption: captionText 
          };
      }

      // Send actual message 
      await whatsappClient.sendMessage(waChatId, messagePayload);
      
      results.push({ studentId: student.id, status: "sent" });
    } catch (error) {
      console.error("Failed to send report:", error);
      results.push({ studentId: student.id, status: "failed", error: error.message });
    }
  }
  
  res.json({ results });
});

module.exports = router;
