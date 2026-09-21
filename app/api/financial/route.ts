import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const fields: Record<string, string[]> = {
  suppliers: ["name", "phone", "contact", "notes"],
  categories: ["name", "kind"],
  accounts: ["name", "kind", "opening_balance"],
  budgets: ["title", "category", "amount", "start_date", "end_date"],
  checks: [
    "check_no",
    "kind",
    "party",
    "amount",
    "issue_date",
    "due_date",
    "status",
    "notes",
  ],
  purchase_items: [
    "purchase_id",
    "description",
    "quantity",
    "unit_price",
  ],
};

const tableNames = new Set(Object.keys(fields));

function cleanBody(type: string, input: Record<string, unknown>) {
  const body: Record<string, unknown> = {};
  for (const key of fields[type] ?? []) {
    if (input[key] !== undefined) body[key] = input[key];
  }
  return body;
}

function validate(
  type: string,
  body: Record<string, unknown>
): string | null {
  const required: Record<string, string[]> = {
    suppliers: ["name"],
    categories: ["name", "kind"],
    accounts: ["name", "kind"],
    budgets: ["title", "amount", "start_date", "end_date"],
    checks: ["check_no", "kind", "amount", "status"],
    purchase_items: [
      "purchase_id",
      "description",
      "quantity",
      "unit_price",
    ],
  };

  for (const key of required[type] ?? []) {
    if (
      body[key] === undefined ||
      body[key] === null ||
      String(body[key]).trim() === ""
    ) {
      return `فیلد «${key}» الزامی است`;
    }
  }

  for (const key of [
    "amount",
    "opening_balance",
    "quantity",
    "unit_price",
    "purchase_id",
  ]) {
    if (
      body[key] !== undefined &&
      (!Number.isFinite(Number(body[key])) || Number(body[key]) < 0)
    ) {
      return `مقدار «${key}» نامعتبر است`;
    }
  }

  return null;
}

async function getContext() {
  const context = await getCompanyContext();
  return context.companyId ? context : null;
}

export async function GET(request: Request) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const type = new URL(request.url).searchParams.get("type") ?? "";
    if (!tableNames.has(type)) {
      return NextResponse.json(
        { success: false, message: "نوع نامعتبر" },
        { status: 400 }
      );
    }

    const rows = await getDb()
      .prepare(
        `SELECT * FROM ${type}
         WHERE company_id = ?
         ORDER BY created_at DESC, id DESC`
      )
      .bind(context.companyId)
      .all<Record<string, unknown>>();

    return NextResponse.json(
      { success: true, data: rows.results },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت اطلاعات مالی",
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

    const input = (await request.json()) as Record<string, unknown>;
    const type = String(input.type ?? "");
    if (!tableNames.has(type)) {
      return NextResponse.json(
        { success: false, message: "نوع نامعتبر" },
        { status: 400 }
      );
    }

    const body = cleanBody(type, input);
    const validation = validate(type, body);
    if (validation) {
      return NextResponse.json(
        { success: false, message: validation },
        { status: 400 }
      );
    }

    const columns = Object.keys(body);
    const values = Object.values(body);
    columns.push("company_id");
    values.push(context.companyId);

    const placeholders = columns.map(() => "?").join(", ");
    const db = getDb();
    const result = await db
      .prepare(
        `INSERT INTO ${type} (${columns.join(", ")})
         VALUES (${placeholders})`
      )
      .bind(...values)
      .run();

    const id = Number(result.meta.last_row_id);
    const row = await db
      .prepare(`SELECT * FROM ${type} WHERE id = ? AND company_id = ?`)
      .bind(id, context.companyId)
      .first<Record<string, unknown>>();

    return NextResponse.json(
      { success: true, data: row ?? null },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در ثبت اطلاعات مالی",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 400 }
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

    const input = (await request.json()) as Record<string, unknown>;
    const type = String(input.type ?? "");
    const id = Number(input.id);

    if (
      !tableNames.has(type) ||
      !Number.isInteger(id) ||
      id < 1
    ) {
      return NextResponse.json(
        { success: false, message: "ورودی نامعتبر" },
        { status: 400 }
      );
    }

    const body = cleanBody(type, input);
    const validation = validate(type, body);
    if (validation) {
      return NextResponse.json(
        { success: false, message: validation },
        { status: 400 }
      );
    }

    const columns = Object.keys(body);
    if (!columns.length) {
      return NextResponse.json(
        { success: false, message: "اطلاعاتی برای ویرایش ارسال نشده است." },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db
      .prepare(`SELECT id FROM ${type} WHERE id = ? AND company_id = ?`)
      .bind(id, context.companyId)
      .first<{ id: number }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "رکورد پیدا نشد." },
        { status: 404 }
      );
    }

    await db
      .prepare(
        `UPDATE ${type}
         SET ${columns.map((column) => `${column} = ?`).join(", ")}
         WHERE id = ? AND company_id = ?`
      )
      .bind(...Object.values(body), id, context.companyId)
      .run();

    const row = await db
      .prepare(`SELECT * FROM ${type} WHERE id = ? AND company_id = ?`)
      .bind(id, context.companyId)
      .first<Record<string, unknown>>();

    return NextResponse.json({ success: true, data: row ?? null });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در ویرایش اطلاعات مالی",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 400 }
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

    const input = (await request.json()) as Record<string, unknown>;
    const type = String(input.type ?? "");
    const id = Number(input.id);

    if (
      !tableNames.has(type) ||
      !Number.isInteger(id) ||
      id < 1
    ) {
      return NextResponse.json(
        { success: false, message: "ورودی نامعتبر" },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db
      .prepare(`SELECT id FROM ${type} WHERE id = ? AND company_id = ?`)
      .bind(id, context.companyId)
      .first<{ id: number }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "رکورد پیدا نشد." },
        { status: 404 }
      );
    }

    await db
      .prepare(`DELETE FROM ${type} WHERE id = ? AND company_id = ?`)
      .bind(id, context.companyId)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در حذف اطلاعات مالی",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 400 }
    );
  }
}
