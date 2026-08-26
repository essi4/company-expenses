import db from "../lib/db";

console.log("شروع بررسی دیتابیس...");

try {
  db.prepare(`
    ALTER TABLE purchases
    ADD COLUMN invoice_image TEXT
  `).run();

  console.log("✅ ستون invoice_image به purchases اضافه شد.");
} catch (error: any) {
  const message = String(error?.message || "");

  if (message.includes("duplicate column name")) {
    console.log("ℹ️ ستون invoice_image از قبل وجود دارد.");
  } else {
    console.error("❌ خطا در purchases:", error);
  }
}

try {
  db.prepare(`
    ALTER TABLE payments
    ADD COLUMN receipt_image TEXT
  `).run();

  console.log("✅ ستون receipt_image به payments اضافه شد.");
} catch (error: any) {
  const message = String(error?.message || "");

  if (message.includes("duplicate column name")) {
    console.log("ℹ️ ستون receipt_image از قبل وجود دارد.");
  } else {
    console.error("❌ خطا در payments:", error);
  }
}

console.log("✅ بررسی ستون‌های عکس تمام شد.");