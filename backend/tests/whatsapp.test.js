const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const whatsappRouter = require('../routes/whatsapp');

// For tests, we stub TWILIO env vars to avoid calling real service

let app;
beforeAll(() => {
  app = express();
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use('/api/whatsapp', whatsappRouter);
});

// This test expects Twilio credentials to be missing and the route to error accordingly
test('POST /api/whatsapp/send without TWILIO credentials returns 500', async () => {
  const res = await request(app).post('/api/whatsapp/send').send({ phoneNumber: '+919876543210', ticketNumber: 'MUM-CIVIC-2025-000001', complaintDetails: {} });
  expect(res.status).toBe(500);
  expect(res.body.success).toBe(false);
});
