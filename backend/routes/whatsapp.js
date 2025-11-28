const express = require('express');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const router = express.Router();

router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, ticketNumber, complaintDetails } = req.body;
    if (!phoneNumber || !ticketNumber) return res.status(400).json({ success: false, error: 'Missing phone or ticket' });

    const messageBody = `Complaint Registered\nTicket: ${ticketNumber}\nCategory: ${complaintDetails?.category || 'N/A'}\nLocation: ${complaintDetails?.location || 'N/A'}\nSeverity: ${complaintDetails?.severity || 'Medium'}\nWe will update you via WhatsApp with next steps.`;

    // Ensure phone is prefixed with whatsapp: for Twilio
    const to = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;

    const result = await sendWhatsAppMessage({ to, body: messageBody });

    return res.json({ success: true, messageId: result.sid, status: result.status });
  } catch (err) {
    console.error('WhatsApp send error', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

module.exports = router;
