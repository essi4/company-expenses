import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await getCompanyContext();

    if (!context.companyId) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const path = new URL(request.url).searchParams.get("path") || "";
    const prefix = `company-${context.companyId}/invoices/`;
    const fileName = path.slice(prefix.length);

    if (
      !path.startsWith(prefix) ||
      !fileName ||
      fileName.includes("/") ||
      fileName.includes("\\") ||
      fileName === "." ||
      fileName === ".." ||
      fileName.includes("..")
    ) {
      return NextResponse.json(
        { success: false, message: "دسترسی به این فایل مجاز نیست." },
        { status: 403, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const { data, error } = await context.supabase.storage
      .from("invoice-images")
      .createSignedUrl(path, 300);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { success: false, message: "تصویر فاکتور پیدا نشد." },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.redirect(data.signedUrl, {
      status: 302,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "خطا در دریافت تصویر." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
