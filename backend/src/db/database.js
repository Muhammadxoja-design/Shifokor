const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE,
    first_name TEXT,
    last_name TEXT,
    gender TEXT,
    age INTEGER,
    phone_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER,
    risk_percentage INTEGER,
    ai_feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (telegram_id) REFERENCES Users(telegram_id)
  );
`);

module.exports = db;
