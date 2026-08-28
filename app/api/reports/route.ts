import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

  // Monday = first day of week
  const diff = day === 0 ? 6 : day - 1;

  const start = new Date(now);

  start.setDate(start.getDate() - diff);

  return `${start.getFullYear()}-${pad2(
    start.getMonth() + 1
  )}-${pad2(start.getDate())}`;
}

function mapPurchase(item: PurchaseRow) {
  const date =
    normalizeDate(item.date) ||
    normalizeDate(item.purchase_date);

  return {
    id: item.id,
    date,
    seller:
      item.seller ||
      item.supplier ||
      "",
    description:
      item.description ||
      item.title ||
      "",
    amount: normalizeAmount(item.amount),
    payment: item.payment || "کارت",
    invoiceNumber:
      item.invoice_number || "",
    invoiceImage:
      item.invoice_image || "",
    notes: item.notes || "",
    status:
      item.status || "ثبت شده",
  };
}

function mapPayment(item: PaymentRow) {
  const date =
    normalizeDate(item.date) ||
    normalizeDate(item.payment_date);

  return {
    id: item.id,
    date,
    title: item.title || "",
    amount: normalizeAmount(item.amount),
    method:
      item.method ||
      item.payment_method ||
      "کارت",
    description:
      item.description || "",
    receiptImage:
      item.receipt_image || "",
    notes: item.notes || "",
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const range =
      searchParams.get("range") || "month";

    let startDate =
      getStartOfMonthGregorian();

    if (range === "today") {
      startDate = getTodayGregorian();
    } else if (range === "week") {
      startDate = getStartOfWeekGregorian();
    }

    const endDate =
      getTodayGregorian();

    /* =====================================================
       PURCHASES
    ===================================================== */

    const {
      data: purchaseData,
      error: purchaseError,
    } = await supabase
      .from("purchases")
      .select(`
        id,
        date,
        purchase_date,
        seller,
        supplier,
        title,
        description,
        amount,
        payment,
        invoice_number,
        invoice_image,
        notes,
        status
      `)
      .gte("purchase_date", startDate)
      .lte("purchase_date", endDate)
      .order("purchase_date", {
        ascending: false,
      })
      .order("id", {
        ascending: false,
      });

    if (purchaseError) {
      console.error(
        "GET reports purchases error:",
        purchaseError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "خطا در دریافت خریدهای گزارش",
          error:
            purchaseError.message,
        },
        { status: 500 }
      );
    }

    /* =====================================================
       PAYMENTS
    ===================================================== */

    const {
      data: paymentData,
      error: paymentError,
    } = await supabase
      .from("payments")
      .select(`
        id,
        date,
        payment_date,
        title,
        amount,
        method,
        payment_method,
        description,
        receipt_image,
        notes
      `)
      .gte("payment_date", startDate)
      .lte("payment_date", endDate)
      .order("payment_date", {
        ascending: false,
      })
      .order("id", {
        ascending: false,
      });

    if (paymentError) {
      console.error(
        "GET reports payments error:",
        paymentError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "خطا در دریافت واریزهای گزارش",
          error:
            paymentError.message,
        },
        { status: 500 }
      );
    }

    const purchases =
      (purchaseData || []).map(
        mapPurchase
      );

    const payments =
      (paymentData || []).map(
        mapPayment
      );

    const purchaseTotal =
      purchases.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const paymentTotal =
      payments.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
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
          purchases.length,

        purchaseTotal,

        paymentCount:
          payments.length,

        paymentTotal,

        balance,
      },

      purchases,

      payments,
    });
  } catch (error) {
    console.error(
      "GET reports exception:",
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
