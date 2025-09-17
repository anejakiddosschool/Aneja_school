// routes/personalMessageRoutes.js
const express = require('express');
const router = express.Router();
const { sendWhatsAppMessage, client } = require('../whatsappClient');

router.post('/send-personal-message', async (req, res) => {
  if (!client.info || !client.info.wid) {
    return res.status(503).json({ message: 'WhatsApp client not ready. Please try again later.' });
  }

  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: 'Students array is required.' });
  }

  const results = [];

  for (const student of students) {
    try {
      if (!student.parentPhone) {
        results.push({ studentId: student.id, status: 'failed', error: 'Missing parentPhone' });
        continue;
      }
      if (!student.message) {
        results.push({ studentId: student.id, status: 'failed', error: 'Missing message' });
        continue;
      }

      await sendWhatsAppMessage(student.parentPhone, student.message);
      results.push({ studentId: student.id, status: 'sent' });
    } catch (error) {
      results.push({ studentId: student.id, status: 'failed', error: error.message });
    }
  }

  return res.json({ results });
});

module.exports = router;
