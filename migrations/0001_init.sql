-- 0001_init
-- Baseline schema ported from lib/db.ts.
-- This migration intentionally creates the complete current schema so
-- later migrations can remain additive and deterministic.

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  seller TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payment TEXT NOT NULL DEFAULT 'کارت',
  invoice_number TEXT,
  invoice_image TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ثبت شده',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'کارت',
  description TEXT,
  receipt_image TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
