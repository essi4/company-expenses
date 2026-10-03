import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { getDb } from "@/lib/db";
import { requireSameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

type Body = {
  company?: string;
  subtitle?: string;
  documentNumber?: string;
  issuedAt?: string;
  status?: "pending" | "approved" | "rejected";
  month?: string;
  note?: string;
  rows?: unknown[];
  signatures?: unknown;
};

type MissionRow = {
  id: number;
  company_id: number;
  document_number: string;
  issued_at: string;
  issued_date: string;
  status: string;
  month: string;
  month_key: string;
  payload_json: string;
  created_at: string;
  updated_at: string;
};

const digits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const monthNames = [
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
  const v = digits(value).replace(/[-.]/g, "/").replace(/\s/g, "");
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(v);
  if (!m) return null;

  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (jy < 1200 || jy > 1600 || jm < 1 || jm > 12 || jd < 1 || jd > (jm <= 6 ? 31 : 30)) {
    return null;
  }

  let j = 365 * (jy - 979) + div(jy - 979, 33) * 8 + div(mod(jy - 979, 33) + 3, 4) + jd - 1;
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

  return String(gy) + "-" + String(gm).padStart(2, "0") + "-" + String(remaining).padStart(2, "0");
}

function normalizeMonthKey(month: string, issuedAt: string) {
  const normalized = digits(month || "");
  const yearMatch = normalized.match(/\d{4}/);
  const year = yearMatch?.[0];

  if (year) {
    const index = monthNames.findIndex((name) => normalized.includes(name));
    if (index >= 0) return year + "-" + String(index + 1).padStart(2, "0");

    const numericMonth = normalized.match(/(?:^|\D)(\d{1,2})(?:\D|$)/);
    if (numericMonth) {
      const value = Number(numericMonth[1]);
      if (value >= 1 && value <= 12) return year + "-" + String(value).padStart(2, "0");
    }
  }

  const issued = digits(issuedAt || "").replace(/[-.]/g, "/");
  const match = /^(\d{4})\/(\d{1,2})\//.exec(issued);
  return match ? match[1] + "-" + match[2].padStart(2, "0") : "";
}

function normalizeIssuedDate(issuedAt: string) {
  return (
    jalaliToGregorian(issuedAt) ||
    (/^\d{4}-\d{2}-\d{2}$/.test(issuedAt) ? issuedAt : new Date().toISOString().slice(0, 10))
  );
}

function safeStatus(value: unknown) {
  return value === "approved" || value === "rejected" || value === "pending" ? value : "pending";
}

function mapMission(row: MissionRow) {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(row.payload_json) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const totalPersonDays = rows.reduce((sum, item) => {
    const days = Number((item as { days?: unknown })?.days ?? 0);
    return sum + (Number.isFinite(days) ? Math.max(0, Math.trunc(days)) : 0);
  }, 0);

  return {
    id: row.id,
    documentNumber: row.document_number,
    issuedAt: row.issued_at,
    issuedDate: row.issued_date,
    status: row.status,
    month: row.month,
    monthKey: row.month_key,
    totalPersonDays,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    payload,
  };
}

async function getContext() {
  const context = await getCompanyContext();
  return context.companyId ? context : null;
}

export async function GET(request: Request) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const documentNumber = new URL(request.url).searchParams.get("documentNumber")?.trim();
    const db = getDb();

    if (documentNumber) {
      const row = await db
        .prepare(
          "SELECT id, company_id, document_number, issued_at, issued_date, status, " +
          "month, month_key, payload_json, created_at, updated_at " +
          "FROM missions WHERE company_id = ? AND document_number = ? LIMIT 1"
        )
        .bind(context.companyId, documentNumber)
        .first<MissionRow>();

      return NextResponse.json(
        { success: true, data: row ? mapMission(row) : null },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const rows = await db
      .prepare(
        "SELECT id, company_id, document_number, issued_at, issued_date, status, " +
        "month, month_key, payload_json, created_at, updated_at " +
        "FROM missions WHERE company_id = ? " +
        "ORDER BY issued_date DESC, id DESC LIMIT 100"
      )
      .bind(context.companyId)
      .all<MissionRow>();

    return NextResponse.json(
      { success: true, data: rows.results.map(mapMission) },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت گزارش‌های مأموریت",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const documentNumber = String(body.documentNumber ?? "").trim();
    const issuedAt = String(body.issuedAt ?? "").trim();
    const month = String(body.month ?? "").trim();
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const status = safeStatus(body.status);

    if (!documentNumber || !issuedAt || !month) {
      return NextResponse.json(
        { success: false, message: "شماره سند، تاریخ و ماه مأموریت الزامی است." },
        { status: 400 }
      );
    }

    const monthKey = normalizeMonthKey(month, issuedAt);
    if (!monthKey) {
      return NextResponse.json(
        { success: false, message: "ماه مأموریت معتبر نیست." },
        { status: 400 }
      );
    }

    const issuedDate = normalizeIssuedDate(issuedAt);
    const payload = JSON.stringify({
      company: String(body.company ?? ""),
      subtitle: String(body.subtitle ?? ""),
      documentNumber,
      issuedAt,
      status,
      month,
      note: String(body.note ?? ""),
      rows,
      signatures: body.signatures ?? {},
    });

    const db = getDb();
    const result = await db
      .prepare(
        "INSERT INTO missions " +
        "(company_id, document_number, issued_at, issued_date, status, month, month_key, payload_json, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) " +
        "ON CONFLICT(company_id, document_number) DO UPDATE SET " +
        "issued_at = excluded.issued_at, " +
        "issued_date = excluded.issued_date, " +
        "status = excluded.status, " +
        "month = excluded.month, " +
        "month_key = excluded.month_key, " +
        "payload_json = excluded.payload_json, " +
        "updated_at = CURRENT_TIMESTAMP"
      )
      .bind(
        context.companyId,
        documentNumber,
        issuedAt,
        issuedDate,
        status,
        month,
        monthKey,
        payload
      )
      .run();

    const row = await db
      .prepare(
        "SELECT id, company_id, document_number, issued_at, issued_date, status, " +
        "month, month_key, payload_json, created_at, updated_at " +
        "FROM missions WHERE company_id = ? AND document_number = ?"
      )
      .bind(context.companyId, documentNumber)
      .first<MissionRow>();

    return NextResponse.json(
      {
        success: true,
        message: "گزارش مأموریت با موفقیت در سامانه ذخیره شد.",
        data: row ? mapMission(row) : null,
        changed: Number(result.meta.changes ?? 0),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در ذخیره گزارش مأموریت",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}
