const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8080;

// Helpful startup logs for Cloud Run troubleshooting
console.log('Starting civicai-frontend server...');
console.log('NODE_ENV=', process.env.NODE_ENV);
console.log('PORT=', PORT);

// Global error handlers so any crash logs surface in Cloud Run logs
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err && err.stack ? err.stack : err);
  // allow logs to flush then exit so Cloud Run can restart the revision if necessary
  setTimeout(() => process.exit(1), 200);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
  setTimeout(() => process.exit(1), 200);
});

// Serve static frontend
const distPath = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Serving static from', distPath);
} else {
  console.warn('Warning: dist folder not found. Make sure you run the build step.');
}

// Lightweight health/readiness endpoint for quick checks
app.get('/_health', (req, res) => res.status(200).json({ status: 'ok' }));

// API: /api/cases - paginated, priority filter, top-100 limit
app.get('/api/cases', (req, res) => {
  try {
    const casesFile = path.resolve(__dirname, '..', 'src', 'mocks', 'cases.json');
    if (!fs.existsSync(casesFile)) {
      console.error('cases.json not found at', casesFile);
      return res.status(500).json({ error: 'cases.json not found on server' });
    }
    const dataRaw = fs.readFileSync(casesFile, 'utf8');
    let data;
    try {
      data = JSON.parse(dataRaw);
    } catch (err) {
      console.error('Failed to parse cases.json', err);
      return res.status(500).json({ error: 'invalid cases.json' });
    }
    let filtered = Array.isArray(data) ? data.slice() : [];
    const priority = req.query.priority;
    if (priority) filtered = filtered.filter((c) => c.priority === priority);
    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const total = filtered.length;
    const limited = filtered.slice(0, 100);
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize || '20', 10)));
    const start = (page - 1) * pageSize;
    const paged = limited.slice(start, start + pageSize);
    res.json({ cases: paged, total: Math.min(total, 100) });
  } catch (err) {
    console.error('Error in /api/cases', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.resolve(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
