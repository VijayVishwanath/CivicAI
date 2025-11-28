const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { initDb } = require('../db');

// Helper - simple ticket generator
function generateTicket() {
  const suffix = Math.floor(100000 + Math.random() * 900000).toString().slice(0,6);
  return `MUM-CIVIC-2025-${suffix}`;
}

async function makeRouter() {
  const router = express.Router();
  const db = await initDb();

  router.post('/register', async (req, res) => {
    try {
      const payload = req.body;
      // Basic validations
      if (!payload || !payload.citizenDetails || !payload.citizenDetails.phone) {
        return res.status(400).json({ success: false, error: 'Missing citizen phone' });
      }

      const id = uuidv4();
      const ticket = generateTicket();
      const createdAt = new Date().toISOString();

      // Use promisified run if available on db
      if (db.runAsync) {
        await db.runAsync(
          `INSERT INTO complaints (id, ticket, phone, location, category, description, severity, status, documents, conversation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id,
          ticket,
          payload.citizenDetails.phone,
          payload.location || '',
          payload.category || '',
          payload.description || '',
          payload.severity || 'Medium',
          payload.status || 'Submitted',
          JSON.stringify(payload.documents || []),
          payload.conversationHistory || '',
          createdAt
        );
      } else {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO complaints (id, ticket, phone, location, category, description, severity, status, documents, conversation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            ticket,
            payload.citizenDetails.phone,
            payload.location || '',
            payload.category || '',
            payload.description || '',
            payload.severity || 'Medium',
            payload.status || 'Submitted',
            JSON.stringify(payload.documents || []),
            payload.conversationHistory || '',
            createdAt,
            function (err) {
              if (err) return reject(err);
              resolve();
            }
          );
        });
      }

      return res.json({ success: true, ticketNumber: ticket, complaintId: id, createdAt });
    } catch (err) {
      console.error('Register error', err);
      return res.status(500).json({ success: false, error: String(err) });
    }
  });

  router.get('/status/:ticket', async (req, res) => {
    try {
      const ticket = req.params.ticket;
  const row = db.getAsync ? await db.getAsync('SELECT * FROM complaints WHERE ticket = ?', ticket) : await new Promise((resolve, reject) => db.get('SELECT * FROM complaints WHERE ticket = ?', ticket, function(err, r){ if(err) return reject(err); resolve(r); }));
      if (!row) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true, status: row.status, ticket: row.ticket, createdAt: row.created_at });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: String(err) });
    }
  });

  return router;
}

module.exports = makeRouter;
