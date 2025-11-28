const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const makeComplaintsRouter = require('../routes/complaints');

let app;

beforeAll(async () => {
  // Use in-memory DB for tests to avoid state leaks
  process.env.DATABASE_FILE = ':memory:';
  app = express();
  app.use(bodyParser.json({ limit: '10mb' }));
  const complaintsRouter = await makeComplaintsRouter();
  app.use('/api/complaints', complaintsRouter);
});

test('POST /api/complaints/register returns ticket', async () => {
  const payload = {
    citizenDetails: { phone: '+919876543210' },
    location: 'Test Location',
    category: 'Pothole',
    description: 'Big hole',
    documents: [],
  };

  const res = await request(app).post('/api/complaints/register').send(payload).expect(200);
  expect(res.body.success).toBe(true);
  expect(res.body.ticketNumber).toMatch(/MUM-CIVIC-2025-/);
});

test('GET /api/complaints/status/:ticket returns 404 for unknown', async () => {
  const res = await request(app).get('/api/complaints/status/NO-SUCH-TICKET');
  expect(res.status).toBe(404);
});
