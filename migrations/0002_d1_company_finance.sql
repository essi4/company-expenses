-- 0002_d1_company_finance
-- Completes the D1 schema needed by the current company-expenses application.
-- Auth remains in Supabase; business data is moved to D1.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_members (
  company_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, user_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

ALTER TABLE purchases ADD COLUMN title TEXT NOT NULL DEFAULT '';
ALTER TABLE purchases ADD COLUMN supplier TEXT;
ALTER TABLE purchases ADD COLUMN category TEXT;
ALTER TABLE purchases ADD COLUMN purchase_date TEXT;
ALTER TABLE purchases ADD COLUMN company_id INTEGER;

ALTER TABLE payments ADD COLUMN payment_date TEXT;
ALTER TABLE payments ADD COLUMN payment_method TEXT;
ALTER TABLE payments ADD COLUMN company_id INTEGER;

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  contact TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'expense',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'bank',
  opening_balance INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checks (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL,
  check_no TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'outgoing',
  party TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  issue_date TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL,
  purchase_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_company_date ON purchases(company_id, purchase_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_payments_company_date ON payments(company_id, payment_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_categories_company ON categories(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_company ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_budgets_company ON budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_checks_company ON checks(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_company_purchase ON purchase_items(company_id, purchase_id);
