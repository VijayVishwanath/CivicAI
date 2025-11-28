const twilio = require('twilio');

function createClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

async function sendWhatsAppMessage({ to, body }) {
  const client = createClient();
  if (!client) {
    throw new Error('Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in env.');
  }

  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!from) throw new Error('TWILIO_WHATSAPP_NUMBER not set');

  const message = await client.messages.create({
    from,
    to,
    body,
  });

  return { sid: message.sid, status: message.status };
}

module.exports = { sendWhatsAppMessage };
