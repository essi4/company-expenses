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

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartOfWeek() {
  const now = new Date();

  const day = now.getDay();

  const diff = day === 0 ? 6 : day - 1;

  const start = new Date(now);

  start.setDate(now.getDate() - diff);

  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, "0");
  const date = String(start.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function getStartOfMonth() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const range = searchParams.get("range") || "month";

    let startDate = getStartOfMonth();

    if (range === "today") {
      startDate = getToday();
    }

    if (range === "week") {
      startDate = getStartOfWeek();
    }

    const endDate = getToday();

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
        WHERE date >= ?
          AND date <= ?
        ORDER BY date DESC, id DESC
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
        WHERE date >= ?
          AND date <= ?
        ORDER BY date DESC, id DESC
      `)
      .all(startDate, endDate) as PaymentRow[];

    const purchaseTotal = purchases.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const paymentTotal = payments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const balance = purchaseTotal - paymentTotal;

    return NextResponse.json({
      success: true,
      range,
      startDate,
      endDate,
      summary: {
        purchaseCount: purchases.length,
        purchaseTotal,
        paymentCount: payments.length,
        paymentTotal,
        balance,
      },
      purchases,
      payments,
    });
  } catch (error) {
    console.error("GET reports error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت گزارش",
      },
      { status: 500 }
    );
  }
}