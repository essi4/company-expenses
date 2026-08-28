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
`);

// اضافه‌کردن ستون‌های گمشده به دیتابیس‌های قدیمی
function ensureColumn(
  tableName: string,
  columnName: string,
  definition: string
) {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  const exists = columns.some(
    (column) => column.name === columnName
  );

  if (!exists) {
    db.exec(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
    );
  }
}

// purchases
ensureColumn("purchases", "invoice_image", "TEXT");
ensureColumn(
  "purchases",
  "status",
  "TEXT NOT NULL DEFAULT 'ثبت شده'"
);

// payments
ensureColumn(
  "payments",
  "title",
  "TEXT NOT NULL DEFAULT ''"
);
ensureColumn(
  "payments",
  "method",
  "TEXT NOT NULL DEFAULT 'کارت'"
);
ensureColumn("payments", "description", "TEXT");
ensureColumn("payments", "receipt_image", "TEXT");
ensureColumn("payments", "notes", "TEXT");

export default db;

