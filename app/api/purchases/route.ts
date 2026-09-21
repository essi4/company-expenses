import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type Body = {
  id?: number | string;
  date?: string;
  seller?: string;
  description?: string;
  amount?: number | string;
  payment?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  notes?: string;
};

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

const mapPurchase = (row: PurchaseRow) => ({
  id: row.id,
  date: row.date ?? row.purchase_date ?? "",
  seller: row.seller ?? row.supplier ?? "",
  description: row.description ?? row.title ?? "",
  amount: normalizeAmount(row.amount),
  payment: row.payment ?? "کارت",
  invoiceNumber: row.invoice_number ?? "",
  invoiceImage: row.invoice_image ?? "",
  notes: row.notes ?? "",
  status: row.status ?? "ثبت شده",
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
          id, date, purchase_date, seller, supplier, title, description,
          amount, payment, invoice_number, invoice_image, notes, status, created_at
         FROM purchases
         WHERE company_id = ?
         ORDER BY id DESC`
      )
      .bind(context.companyId)
      .all<PurchaseRow>();

    return NextResponse.json(
      { success: true, data: rows.results.map(mapPurchase) },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت خریدها",
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
    const seller = String(body.seller ?? "").trim();
    const description = String(body.description ?? "").trim();
    const amount = normalizeAmount(body.amount);
    const date =
      normalizeDate(body.date) ?? new Date().toISOString().slice(0, 10);

    if (!seller || !description || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "فروشنده، شرح خرید و مبلغ صحیح الزامی است.",
        },
        { status: 400 }
      );
    }

    const result = await getDb()
      .prepare(
        `INSERT INTO purchases
          (date, purchase_date, seller, supplier, title, description, amount,
           payment, invoice_number, invoice_image, notes, status, company_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        date,
        date,
        seller,
        seller,
        description,
        description,
        amount,
        String(body.payment ?? "کارت"),
        String(body.invoiceNumber ?? ""),
        String(body.invoiceImage ?? ""),
        String(body.notes ?? ""),
        "ثبت شده",
        context.companyId
      )
      .run();

    const id = Number(result.meta.last_row_id);
    const row = await getDb()
      .prepare(
        `SELECT
          id, date, purchase_date, seller, supplier, title, description,
          amount, payment, invoice_number, invoice_image, notes, status, created_at
         FROM purchases
         WHERE id = ? AND company_id = ?`
      )
      .bind(id, context.companyId)
      .first<PurchaseRow>();

    return NextResponse.json(
      {
        success: true,
        message: "خرید با موفقیت ذخیره شد.",
        data: row ? mapPurchase(row) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در ذخیره خرید",
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
    const seller = String(body.seller ?? "").trim();
    const description = String(body.description ?? "").trim();
    const amount = normalizeAmount(body.amount);
    const date =
      normalizeDate(body.date) ?? new Date().toISOString().slice(0, 10);

    if (!Number.isInteger(id) || id <= 0 || !seller || !description || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "اطلاعات ویرایش صحیح نیست." },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db
      .prepare("SELECT id FROM purchases WHERE id = ? AND company_id = ?")
      .bind(id, context.companyId)
      .first<{ id: number }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "خرید پیدا نشد." },
        { status: 404 }
      );
    }

    await db
      .prepare(
        `UPDATE purchases
         SET date = ?, purchase_date = ?, seller = ?, supplier = ?,
             title = ?, description = ?, amount = ?, payment = ?,
             invoice_number = ?,
             invoice_image = COALESCE(?, invoice_image),
             notes = ?, status = ?
         WHERE id = ? AND company_id = ?`
      )
      .bind(
        date,
        date,
        seller,
        seller,
        description,
        description,
        amount,
        String(body.payment ?? "کارت"),
        String(body.invoiceNumber ?? ""),
        body.invoiceImage === undefined ? null : String(body.invoiceImage ?? ""),
        String(body.notes ?? ""),
        "ثبت شده",
        id,
        context.companyId
      )
      .run();

    const row = await db
      .prepare(
        `SELECT
          id, date, purchase_date, seller, supplier, title, description,
          amount, payment, invoice_number, invoice_image, notes, status, created_at
         FROM purchases
         WHERE id = ? AND company_id = ?`
      )
      .bind(id, context.companyId)
      .first<PurchaseRow>();

    return NextResponse.json({
      success: true,
      message: "خرید با موفقیت ویرایش شد.",
      data: row ? mapPurchase(row) : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در ویرایش خرید",
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
        { success: false, message: "شناسه خرید صحیح نیست." },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db
      .prepare(
        "SELECT id, invoice_image FROM purchases WHERE id = ? AND company_id = ?"
      )
      .bind(id, context.companyId)
      .first<{ id: number; invoice_image: string | null }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "خرید پیدا نشد." },
        { status: 404 }
      );
    }

    await db
      .prepare("DELETE FROM purchases WHERE id = ? AND company_id = ?")
      .bind(id, context.companyId)
      .run();

    return NextResponse.json({
      success: true,
      message: "خرید با موفقیت حذف شد.",
      image: existing.invoice_image || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در حذف خرید",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}
