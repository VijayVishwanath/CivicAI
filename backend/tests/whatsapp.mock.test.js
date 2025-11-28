// Mock Twilio client to simulate successful WhatsApp sends
process.env.TWILIO_ACCOUNT_SID = 'AC_MOCK';
process.env.TWILIO_AUTH_TOKEN = 'MOCK_TOKEN';
process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+15005550006';

jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: {
      create: jest.fn(({ from, to, body }) => {
        // Simulate Twilio response
        return Promise.resolve({ sid: 'SMMOCK1234567890', status: 'sent' });
      }),
    },
  }));
});

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Require the router after mocking Twilio
const whatsappRouter = require('../routes/whatsapp');

describe('WhatsApp route with mocked Twilio', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use('/api/whatsapp', whatsappRouter);
  });

  test('POST /api/whatsapp/send returns success when Twilio responds', async () => {
    const res = await request(app)
      .post('/api/whatsapp/send')
      .send({ phoneNumber: '+919876543210', ticketNumber: 'MUM-CIVIC-2025-MOCK', complaintDetails: {} });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('messageId', 'SMMOCK1234567890');
    expect(res.body).toHaveProperty('status', 'sent');
  });
});
