require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const makeComplaintsRouter = require('./routes/complaints');
const whatsappRouter = require('./routes/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Mount API routes under /api
(async () => {
  const complaintsRouter = await makeComplaintsRouter();
  app.use('/api/complaints', complaintsRouter);
  app.use('/api/whatsapp', whatsappRouter);

  app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  app.listen(PORT, () => {
    console.log(`Backend API listening on port ${PORT}`);
  });
})();
