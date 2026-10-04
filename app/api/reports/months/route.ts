import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const index = Number(month) - 1;
  if (!/^14\d{2}$/.test(year) || index < 0 || index > 11) return monthKey;
  return `${MONTH_NAMES[index]} ${year.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}`;
}

export async function GET() {
  try {
    const context = await getCompanyContext();
    if (!context.companyId) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const result = await getDb()
      .prepare(
        `SELECT
           month_key,
           SUM(CASE WHEN type = 'invoice' THEN 1 ELSE 0 END) AS invoice_count,
           SUM(CASE WHEN type = 'mission' THEN 1 ELSE 0 END) AS mission_count,
           COALESCE(SUM(CASE WHEN type = 'invoice' THEN total_amount ELSE 0 END), 0) AS total_amount,
           COALESCE(SUM(CASE WHEN type = 'mission' THEN total_days ELSE 0 END), 0) AS total_days
         FROM documents
         WHERE company_id = ?
         GROUP BY month_key
         ORDER BY month_key DESC`
      )
      .bind(context.companyId)
      .all();

    const data = (result.results ?? []).map((row) => {
      const item = row as Record<string, unknown>;
      const monthKey = String(item.month_key);
      return {
        month_key: monthKey,
        label: monthLabel(monthKey),
        invoice_count: Number(item.invoice_count ?? 0),
        mission_count: Number(item.mission_count ?? 0),
        total_amount: Number(item.total_amount ?? 0),
        total_days: Number(item.total_days ?? 0),
      };
    });

    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[reports/months] failed", error);
    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت گزارش ماه‌ها",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 },
    );
  }
}
