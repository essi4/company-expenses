import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { getCompanyContext } from "@/lib/company";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCompanyContext();
    if (!context.companyId) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
    }

    const requestedPath = new URL(request.url).searchParams.get("path") || "";
    const prefix = `company-${context.companyId}/invoices/`;
    const fileName = requestedPath.startsWith(prefix) ? requestedPath.slice(prefix.length) : "";
    if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
      return NextResponse.json({ success: false, message: "دسترسی به این فایل مجاز نیست." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
    }

    if (process.env.LOCAL_MODE === "true") {
      const dataDir = path.resolve(process.env.LOCAL_DATA_DIR || path.join(process.cwd(), "data"));
      const filePath = path.join(dataDir, "uploads", `company-${context.companyId}`, "invoices", fileName);
      const bytes = await readFile(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";
      return new NextResponse(new Uint8Array(bytes), {
        headers: { "Content-Type": contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
      });
    }

    const { data, error } = await context.supabase.storage.from("invoice-images").createSignedUrl(requestedPath, 300);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ success: false, message: "تصویر فاکتور پیدا نشد." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    }
    return NextResponse.redirect(data.signedUrl, { status: 302, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ success: false, message: "خطا در دریافت تصویر." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
}
