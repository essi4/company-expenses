import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

type PurchaseRow = {
  id: number;
  date: string;
  seller: string;
  description: string;
  amount: number;
  payment: string;
  invoiceNumber: string | null;
  notes: string | null;
  status: string;
};

type PaymentRow = {
  id: number;
  date: string;
  title: string;
  amount: number;
  method: string;
  description: string | null;
  notes: string | null;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
  );
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return toEnglishDigits(value)
    .trim()
    .replace(/\//g, "-")
    .replace(/\./g, "-")
    .split(" ")[0];
}

function getTodayGregorian() {
  const now = new Date();

  return `${now.getFullYear()}-${pad2(
    now.getMonth() + 1
  )}-${pad2(now.getDate())}`;
}

function getStartOfMonthGregorian() {
  const now = new Date();

  return `${now.getFullYear()}-${pad2(
    now.getMonth() + 1
  )}-01`;
}

function getStartOfWeekGregorian() {
  const now = new Date();

  const day = now.getDay();

  // Monday = 1, Sunday = 0
  const diff = day === 0 ? 6 : day - 1;

  const start = new Date(now);

  start.setDate(start.getDate() - diff);

  return `${start.getFullYear()}-${pad2(
    start.getMonth() + 1
  )}-${pad2(start.getDate())}`;
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const range = searchParams.get("range") || "month";

    let startDate = getStartOfMonthGregorian();

    if (range === "today") {
      startDate = getTodayGregorian();
    } else if (range === "week") {
      startDate = getStartOfWeekGregorian();
    } else if (range === "month") {
      startDate = getStartOfMonthGregorian();
    }

    const endDate = getTodayGregorian();

    const dateSql = `
      replace(
        replace(
          replace(date, '/', '-'),
          '.', '-'
        ),
        ' ',
        ''
      )
    `;

    const purchases = db
      .prepare(`
        SELECT
          id,
          date,
          seller,
          description,
          amount,
          payment,
          invoice_number AS invoiceNumber,
          notes,
          status
        FROM purchases
        WHERE
          ${dateSql} >= ?
          AND ${dateSql} <= ?
        ORDER BY
          ${dateSql} DESC,
          id DESC
      `)
      .all(startDate, endDate) as PurchaseRow[];

    const payments = db
      .prepare(`
        SELECT
          id,
          date,
          title,
          amount,
          method,
          description,
          notes
        FROM payments
        WHERE
          ${dateSql} >= ?
          AND ${dateSql} <= ?
        ORDER BY
          ${dateSql} DESC,
          id DESC
      `)
      .all(startDate, endDate) as PaymentRow[];

    const normalizedPurchases = purchases.map(
      (item) => ({
        ...item,
        date: normalizeDate(item.date),
        amount: normalizeAmount(item.amount),
      })
    );

    const normalizedPayments = payments.map(
      (item) => ({
        ...item,
        date: normalizeDate(item.date),
        amount: normalizeAmount(item.amount),
      })
    );

    const purchaseTotal =
      normalizedPurchases.reduce(
        (sum, item) => sum + item.amount,
        0
      );

    const paymentTotal =
      normalizedPayments.reduce(
        (sum, item) => sum + item.amount,
        0
      );

    const balance =
      purchaseTotal - paymentTotal;

    return NextResponse.json({
      success: true,
      range,
      startDate,
      endDate,
      summary: {
        purchaseCount:
          normalizedPurchases.length,
        purchaseTotal,
        paymentCount:
          normalizedPayments.length,
        paymentTotal,
        balance,
      },
      purchases: normalizedPurchases,
      payments: normalizedPayments,
    });
  } catch (error) {
    console.error(
      "GET reports error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت گزارش",
        error:
          error instanceof Error
            ? error.message
            : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

