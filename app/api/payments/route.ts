import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type Body = {
  id?: number | string;
  date?: string;
  title?: string;
  amount?: number | string;
  method?: string;
  description?: string;
  receiptImage?: string;
  notes?: string;
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
  created_at: string | null;
};

const digits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const normalizeAmount = (value: unknown) => {
  const number =
    typeof value === "number"
      ? value
      : Number(digits(String(value ?? "")).replace(/[,٬]/g, ""));
  return Number.isFinite(number) ? number : 0;
};

const normalizeDate = (value: unknown) => {
  if (!value) return null;
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(
    digits(String(value).trim())
  );
  return match
    ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
    : null;
};

const mapPayment = (row: PaymentRow) => ({
  id: row.id,
  date: row.date ?? row.payment_date ?? "",
  title: row.title ?? "",
  amount: normalizeAmount(row.amount),
  method: row.method ?? row.payment_method ?? "کارت",
  description: row.description ?? "",
  receiptImage: row.receipt_image ?? "",
  notes: row.notes ?? "",
  createdAt: row.created_at ?? null,
});

async function getContext() {
  const context = await getCompanyContext();
  return context.companyId ? context : null;
}

export async function GET() {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json(
        { success: false, message: "برای مشاهده اطلاعات وارد حساب شوید." },
        { status: 401 }
      );
    }

    const rows = await getDb()
      .prepare(
        `SELECT
          id, date, payment_date, title, amount, method, payment_method,
          description, receipt_image, notes, created_at
         FROM payments
         WHERE company_id = ?
         ORDER BY id DESC`
      )
      .bind(context.companyId)
      .all<PaymentRow>();

    return NextResponse.json(
      { success: true, data: rows.results.map(mapPayment) },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت واریزها",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const body: Body = await request.json();
    const title = String(body.title ?? "").trim();
    const amount = normalizeAmount(body.amount);
    const date =
      normalizeDate(body.date) ?? new Date().toISOString().slice(0, 10);

    if (!title || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "عنوان و مبلغ صحیح الزامی است." },
        { status: 400 }
      );
    }

    const method = String(body.method ?? "کارت");

    const result = await getDb()
      .prepare(
        `INSERT INTO payments
          (date, payment_date, title, amount, method, payment_method,
           description, receipt_image, notes, company_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        date,
        date,
        title,
        amount,
        method,
        method,
        String(body.description ?? ""),
        String(body.receiptImage ?? ""),
        String(body.notes ?? ""),
        context.companyId
      )
      .run();

    const id = Number(result.meta.last_row_id);
    const row = await getDb()
      .prepare(
        `SELECT
          id, date, payment_date, title, amount, method, payment_method,
          description, receipt_image, notes, created_at
         FROM payments
         WHERE id = ? AND company_id = ?`
      )
      .bind(id, context.companyId)
      .first<PaymentRow>();

    return NextResponse.json(
      {
        success: true,
        message: "واریز با موفقیت ذخیره شد.",
        data: row ? mapPayment(row) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در ذخیره واریز",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const body: Body = await request.json();
    const id = Number(body.id);
    const title = String(body.title ?? "").trim();
    const amount = normalizeAmount(body.amount);
    const date =
      normalizeDate(body.date) ?? new Date().toISOString().slice(0, 10);

    if (!Number.isInteger(id) || id <= 0 || !title || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "اطلاعات ویرایش صحیح نیست." },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db
      .prepare("SELECT id FROM payments WHERE id = ? AND company_id = ?")
      .bind(id, context.companyId)
      .first<{ id: number }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "واریز پیدا نشد." },
        { status: 404 }
      );
    }

    const method = String(body.method ?? "کارت");

    await db
      .prepare(
        `UPDATE payments
         SET date = ?, payment_date = ?, title = ?, amount = ?,
             method = ?, payment_method = ?, description = ?,
             receipt_image = COALESCE(?, receipt_image), notes = ?
         WHERE id = ? AND company_id = ?`
      )
      .bind(
        date,
        date,
        title,
        amount,
        method,
        method,
        String(body.description ?? ""),
        body.receiptImage === undefined ? null : String(body.receiptImage ?? ""),
        String(body.notes ?? ""),
        id,
        context.companyId
      )
      .run();

    const row = await db
      .prepare(
        `SELECT
          id, date, payment_date, title, amount, method, payment_method,
          description, receipt_image, notes, created_at
         FROM payments
         WHERE id = ? AND company_id = ?`
      )
      .bind(id, context.companyId)
      .first<PaymentRow>();

    return NextResponse.json({
      success: true,
      message: "واریز با موفقیت ویرایش شد.",
      data: row ? mapPayment(row) : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در ویرایش واریز",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const body: Body = await request.json();
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, message: "شناسه واریز صحیح نیست." },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db
      .prepare(
        "SELECT id, receipt_image FROM payments WHERE id = ? AND company_id = ?"
      )
      .bind(id, context.companyId)
      .first<{ id: number; receipt_image: string | null }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "واریز پیدا نشد." },
        { status: 404 }
      );
    }

    await db
      .prepare("DELETE FROM payments WHERE id = ? AND company_id = ?")
      .bind(id, context.companyId)
      .run();

    return NextResponse.json({
      success: true,
      message: "واریز با موفقیت حذف شد.",
      image: existing.receipt_image || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در حذف واریز",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}
