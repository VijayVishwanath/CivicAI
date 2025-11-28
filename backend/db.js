const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'data', 'complaints.db');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function initDb() {
  ensureDir(DB_FILE);

  const db = new sqlite3.Database(DB_FILE);

  // Promisify common methods
  db.runAsync = promisify(db.run).bind(db);
  db.getAsync = promisify(db.get).bind(db);
  db.allAsync = promisify(db.all).bind(db);
  db.execAsync = promisify(db.exec).bind(db);
  db.prepareAsync = function (sql) {
    const stmt = db.prepare(sql);
    stmt.runAsync = promisify(stmt.run).bind(stmt);
    stmt.finalizeAsync = promisify(stmt.finalize).bind(stmt);
    return stmt;
  };

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      ticket TEXT UNIQUE,
      phone TEXT,
      location TEXT,
      category TEXT,
      description TEXT,
      severity TEXT,
      status TEXT,
      documents TEXT,
      conversation TEXT,
      created_at TEXT
    );
  `;

  return db.execAsync(createTableSql).then(() => db);
}

module.exports = { initDb, DB_FILE };
