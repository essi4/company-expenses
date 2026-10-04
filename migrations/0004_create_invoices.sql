-- migrations/0004_create_invoices.sql

CREATE TABLE IF NOT EXISTS invoices (
  id              TEXT PRIMARY KEY,
  company_id      INTEGER NOT NULL,
  document_number TEXT NOT NULL,
  issued_at       TEXT NOT NULL,
  month_key       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  title           TEXT,
  total_amount    INTEGER NOT NULL DEFAULT 0,
  total_deposit   INTEGER NOT NULL DEFAULT 0,
  balance         INTEGER NOT NULL DEFAULT 0,
  payload_json    TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_company_month
  ON invoices(company_id, month_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_docnum
  ON invoices(company_id, document_number);
