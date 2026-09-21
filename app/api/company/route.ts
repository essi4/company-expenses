import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await getCompanyContext();

    if (!context.companyId) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const company = await getDb()
      .prepare("SELECT id, name, created_at FROM companies WHERE id = ?")
      .bind(context.companyId)
      .first<{ id: number; name: string; created_at: string | null }>();

    if (!company) {
      return NextResponse.json(
        { success: false, message: "شرکت پیدا نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: company },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت شرکت",
        error: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}
