import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "company-expenses.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    seller TEXT NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment TEXT NOT NULL,
    invoice_number TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ثبت شده',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    amount INTEGER NOT NULL,
    method TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;