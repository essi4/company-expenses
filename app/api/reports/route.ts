import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type PurchaseRow = {
  id: number;
  date: string | null;
  purchase_date: string | null;
  seller: string | null;
  supplier: string | null;
  title: string | null;
  description: string | null;
  amount: number | string | null;
  payment: string | null;
  invoice_number: string | null;
  invoice_image: string | null;
  notes: string | null;
  status: string | null;
};

type PaymentRow = {
  id: number;
  date: string | null;
  payment_date: string | null;
  title: string | null;
  amount: number | string | null;
  method: string | null;
  payment_method: string | null;
  description: string | null;
  receipt_image: string | null;
  notes: string | null;
};

type MissionRow = {
  id: number;
  document_number: string;
  issued_at: string;
  issued_date: string;
  status: string;
  month: string;
  month_key: string;
  payload_json: string;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
  );
}

function normalizeAmount(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = toEnglishDigits(value)
      .replace(/,/g, "")
      .replace(/٬/g, "")
      .trim();
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  return 0;
}

function normalizeDate(value: unknown) {
  if (!value) return null;
  return toEnglishDigits(String(value))
    .trim()
    .replace(/\//g, "-")
    .replace(/\./g, "-")
    .split(" ")[0];
}

const persianMonthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function div(a: number, b: number) {
  return Math.floor(a / b);
}

function mod(a: number, b: number) {
  return a - Math.floor(a / b) * b;
}

function jalaliToGregorian(value: string) {
  const v = toEnglishDigits(value).replace(/[-.]/g, "-").trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  if (!m) return null;

  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (jy < 1200 || jy > 1600 || jm < 1 || jm > 12 || jd < 1 || jd > (jm <= 6 ? 31 : 30)) {
    return null;
  }

  let j =
    365 * (jy - 979) +
    div(jy - 979, 33) * 8 +
    div(mod(jy - 979, 33) + 3, 4) +
    jd -
    1;
  j += jm < 7 ? (jm - 1) * 31 : (jm - 1) * 30 + 6;
  j += 355668;

  let gy = 400 * div(j, 146097);
  j = mod(j, 146097);
  if (j > 36524) {
    gy += 100 * div(--j, 36524);
    j = mod(j, 36524);
    if (j >= 365) j++;
  }

  gy += 4 * div(j, 1461);
  j = mod(j, 1461);
  if (j > 365) {
    gy += div(j - 1, 365);
    j = mod(j - 1, 365);
  }

  const gd = j + 1;
  const leap = gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  let remaining = gd;
  while (remaining > days[gm - 1]) {
    remaining -= days[gm - 1];
    gm++;
  }

  return `${gy}-${String(gm).padStart(2, "0")}-${String(remaining).padStart(2, "0")}`;
}

function getCurrentPersianMonthKey() {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return year && month ? `${year}-${month.padStart(2, "0")}` : "";
}

function normalizePersianMonthKey(value: string | null) {
  if (!value) return "";
  const normalized = toEnglishDigits(value).trim();
  const match = /^(\d{4})[-/](\d{1,2})$/.exec(normalized);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}`;

  const yearMatch = normalized.match(/\d{4}/);
  const year = yearMatch?.[0];
  if (!year) return "";
  const index = persianMonthNames.findIndex((name) => normalized.includes(name));
  return index >= 0 ? `${year}-${String(index + 1).padStart(2, "0")}` : "";
}

function getPersianMonthRange(monthKey: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  const startDate = jalaliToGregorian(
    `${year}-${String(month).padStart(2, "0")}-01`
  );
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endExclusive = jalaliToGregorian(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`
  );

  if (!startDate || !endExclusive) return null;

  const end = new Date(`${endExclusive}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);

  return {
    startDate,
    endDate: end.toISOString().slice(0, 10),
    monthLabel: persianMonthNames[month - 1] + " " + String(year),
  };
}

function getTodayGregorian() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
    now.getDate()
  )}`;
}

function getStartOfWeekGregorian() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(start.getDate() - diff);
  return `${start.getFullYear()}-${pad2(
    start.getMonth() + 1
  )}-${pad2(start.getDate())}`;
}

function mapPurchase(item: PurchaseRow) {
  const date =
    normalizeDate(item.date) || normalizeDate(item.purchase_date) || "";

  return {
    id: item.id,
    date,
    seller: item.seller || item.supplier || "",
    description: item.description || item.title || "",
    amount: normalizeAmount(item.amount),
    payment: item.payment || "کارت",
    invoiceNumber: item.invoice_number || "",
    invoiceImage: item.invoice_image || "",
    notes: item.notes || "",
    status: item.status || "ثبت شده",
  };
}

function mapPayment(item: PaymentRow) {
  const date =
    normalizeDate(item.date) || normalizeDate(item.payment_date) || "";

  return {
    id: item.id,
    date,
    title: item.title || "",
    amount: normalizeAmount(item.amount),
    method: item.method || item.payment_method || "کارت",
    description: item.description || "",
    receiptImage: item.receipt_image || "",
    notes: item.notes || "",
  };
}

export async function GET(request: Request) {
  try {
    const context = await getCompanyContext();

    if (!context.companyId) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const params = new URL(request.url).searchParams;
    const range = params.get("range") || "month";

    let startDate = getTodayGregorian();
    let endDate = getTodayGregorian();
    let monthKey = "";
    let monthLabel = "";

    if (range === "month") {
      monthKey = normalizePersianMonthKey(params.get("month")) || getCurrentPersianMonthKey();
      const monthRange = getPersianMonthRange(monthKey);
      if (!monthRange) {
        return NextResponse.json(
          { success: false, message: "ماه گزارش معتبر نیست." },
          { status: 400 }
        );
      }
      startDate = monthRange.startDate;
      endDate = monthRange.endDate;
      monthLabel = monthRange.monthLabel;
    } else if (range === "week") {
      startDate = getStartOfWeekGregorian();
    }

    const db = getDb();

    const [purchaseResult, paymentResult, missionResult] = await Promise.all([
      db
        .prepare(
          `SELECT
            id, date, purchase_date, seller, supplier, title, description,
            amount, payment, invoice_number, invoice_image, notes, status
           FROM purchases
           WHERE company_id = ?
             AND (
               (COALESCE(purchase_date, date) >= ? AND COALESCE(purchase_date, date) <= ?)
               OR substr(COALESCE(purchase_date, date), 1, 7) = ?
             )
           ORDER BY COALESCE(purchase_date, date) DESC, id DESC`
        )
        .bind(context.companyId, startDate, endDate, monthKey)
        .all<PurchaseRow>(),
      db
        .prepare(
          `SELECT
            id, date, payment_date, title, amount, method, payment_method,
            description, receipt_image, notes
           FROM payments
           WHERE company_id = ?
             AND (
               (COALESCE(payment_date, date) >= ? AND COALESCE(payment_date, date) <= ?)
               OR substr(COALESCE(payment_date, date), 1, 7) = ?
             )
           ORDER BY COALESCE(payment_date, date) DESC, id DESC`
        )
        .bind(context.companyId, startDate, endDate, monthKey)
        .all<PaymentRow>(),
      db
        .prepare(
          `SELECT
            id, document_number, issued_at, issued_date, status, month, month_key, payload_json
           FROM missions
           WHERE company_id = ?
             AND issued_date >= ?
             AND issued_date <= ?
           ORDER BY issued_date DESC, id DESC`
        )
        .bind(context.companyId, startDate, endDate)
        .all<MissionRow>(),
    ]);

    const purchases = purchaseResult.results.map(mapPurchase);
    const payments = paymentResult.results.map(mapPayment);
    const missions = missionResult.results.map((row) => {
      let payload: { rows?: Array<{ days?: unknown }> } = {};
      try {
        payload = JSON.parse(row.payload_json) as { rows?: Array<{ days?: unknown }> };
      } catch {
        payload = {};
      }
      const totalPersonDays = Array.isArray(payload.rows)
        ? payload.rows.reduce((sum, item) => sum + Math.max(0, Math.trunc(Number(item.days ?? 0) || 0)), 0)
        : 0;

      return {
        id: row.id,
        documentNumber: row.document_number,
        issuedAt: row.issued_at,
        issuedDate: row.issued_date,
        status: row.status,
        month: row.month,
        monthKey: row.month_key,
        totalPersonDays,
      };
    });

    const purchaseTotal = purchases.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const paymentTotal = payments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return NextResponse.json(
      {
        success: true,
        range,
        startDate,
        endDate,
        monthKey: monthKey || null,
        monthLabel: monthLabel || null,
        summary: {
          purchaseCount: purchases.length,
          purchaseTotal,
          paymentCount: payments.length,
          paymentTotal,
          missionCount: missions.length,
          missionPersonDays: missions.reduce((sum, item) => sum + item.totalPersonDays, 0),
          balance: purchaseTotal - paymentTotal,
        },
        purchases,
        payments,
        missions,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "خطا در دریافت گزارش" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
