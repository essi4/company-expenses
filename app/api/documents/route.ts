import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["invoice", "mission"];

export async function GET(request: Request) {
  try {
    const context = await getCompanyContext();
    if (!context.companyId) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    const month = searchParams.get("month");

    const db = getDb();

    if (id) {
      const doc = await db
        .prepare("SELECT * FROM documents WHERE id = ? AND company_id = ? LIMIT 1")
        .bind(id, context.companyId)
        .first();
      if (!doc) {
        return NextResponse.json(
          { success: false, message: "سند پیدا نشد." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: true, data: doc },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const clauses = ["company_id = ?"];
    const params: unknown[] = [context.companyId];
    if (type && ALLOWED_TYPES.includes(type)) {
      clauses.push("type = ?");
      params.push(type);
    }
    if (month) {
      clauses.push("month_key = ?");
      params.push(month);
    }

    const sql = `SELECT id, type, document_number, issued_at, month_key, status, title, total_amount, total_days, created_at, updated_at FROM documents WHERE ${clauses.join(" AND ")} ORDER BY issued_at DESC, created_at DESC`;
    const result = await db.prepare(sql).bind(...params).all();

    return NextResponse.json(
      { success: true, data: result.results ?? [] },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت اسناد",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCompanyContext();
    if (!context.companyId) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      document_number,
      issued_at,
      month_key,
      status = "draft",
      title = null,
      total_amount = 0,
      total_days = 0,
      payload_json,
    } = body ?? {};

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: "نوع سند نامعتبر است." },
        { status: 400 }
      );
    }
    if (!document_number || !issued_at || !month_key || !payload_json) {
      return NextResponse.json(
        { success: false, message: "فیلدهای الزامی ناقص است." },
        { status: 400 }
      );
    }

    const payloadStr =
      typeof payload_json === "string"
        ? payload_json
        : JSON.stringify(payload_json);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await getDb()
      .prepare(
        `INSERT INTO documents (id, company_id, type, document_number, issued_at, month_key, status, title, total_amount, total_days, payload_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        context.companyId,
        type,
        document_number,
        issued_at,
        month_key,
        status,
        title,
        total_amount,
        total_days,
        payloadStr,
        now,
        now
      )
      .run();

    return NextResponse.json(
      { success: true, data: { id } },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در ذخیره سند",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const context = await getCompanyContext();
    if (!context.companyId) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه سند الزامی است." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      document_number,
      issued_at,
      month_key,
      status,
      title,
      total_amount,
      total_days,
      payload_json,
    } = body ?? {};

    const payloadStr =
      payload_json === undefined
        ? null
        : typeof payload_json === "string"
        ? payload_json
        : JSON.stringify(payload_json);

    const now = new Date().toISOString();

    const result = await getDb()
      .prepare(
        `UPDATE documents SET
           document_number = COALESCE(?, document_number),
           issued_at = COALESCE(?, issued_at),
           month_key = COALESCE(?, month_key),
           status = COALESCE(?, status),
           title = COALESCE(?, title),
           total_amount = COALESCE(?, total_amount),
           total_days = COALESCE(?, total_days),
           payload_json = COALESCE(?, payload_json),
           updated_at = ?
         WHERE id = ? AND company_id = ?`
      )
      .bind(
        document_number ?? null,
        issued_at ?? null,
        month_key ?? null,
        status ?? null,
        title ?? null,
        total_amount ?? null,
        total_days ?? null,
        payloadStr,
        now,
        id,
        context.companyId
      )
      .run();

    return NextResponse.json(
      { success: true, data: { id, changes: result.meta?.changes ?? 0 } },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در ویرایش سند",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getCompanyContext();
    if (!context.companyId) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه سند الزامی است." },
        { status: 400 }
      );
    }

    await getDb()
      .prepare("DELETE FROM documents WHERE id = ? AND company_id = ?")
      .bind(id, context.companyId)
      .run();

    return NextResponse.json(
      { success: true, data: { id } },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در حذف سند",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
                                }
