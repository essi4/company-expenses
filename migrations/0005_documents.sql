-- migrations/0005_documents.sql
-- جدول واحد برای فاکتورها و مأموریت‌ها

CREATE TABLE IF NOT EXISTS documents (
  id              TEXT PRIMARY KEY,
  company_id      INTEGER NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('invoice', 'mission')),
  document_number TEXT NOT NULL,
  issued_at       TEXT NOT NULL,
  month_key       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  title           TEXT,
  total_amount    INTEGER NOT NULL DEFAULT 0,
  total_days      INTEGER NOT NULL DEFAULT 0,
  payload_json    TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_company_month
  ON documents(company_id, month_key, type);

CREATE INDEX IF NOT EXISTS idx_documents_number
  ON documents(company_id, type, document_number);

CREATE INDEX IF NOT EXISTS idx_documents_status
  ON documents(company_id, status);
