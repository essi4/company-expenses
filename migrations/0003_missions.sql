-- 0003_missions
-- Persist each mission report as one company-scoped record.
-- The full report stays in payload_json so existing form/export structure needs no redesign.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  document_number TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  issued_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  month TEXT NOT NULL,
  month_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, document_number),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_missions_company_month
  ON missions(company_id, month_key, issued_date DESC, id DESC);
