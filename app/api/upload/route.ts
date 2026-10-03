import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCompanyContext } from "@/lib/company";
import { requireSameOrigin } from "@/lib/security";
import { sniffImageType } from "@/lib/validate-image";

export const runtime = "nodejs";

const BUCKET_NAME = "invoice-images";
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX = 5 * 1024 * 1024;

const EXTENSIONS: Record<(typeof TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  try {
    const context = await getCompanyContext();

    if (!context.companyId) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "فایل عکس انتخاب نشده است." },
        { status: 400 }
      );
    }

    if (!TYPES.includes(file.type as (typeof TYPES)[number])) {
      return NextResponse.json(
        { success: false, message: "فرمت عکس مجاز نیست." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX) {
      return NextResponse.json(
        { success: false, message: "حجم عکس باید بیشتر از صفر و حداکثر ۵ مگابایت باشد." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const actualType = sniffImageType(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    );

    if (actualType !== file.type) {
      return NextResponse.json(
        { success: false, message: "محتوای فایل با فرمت اعلام‌شده سازگار نیست." },
        { status: 415 }
      );
    }

    const contentType = actualType as (typeof TYPES)[number];
    const extension = EXTENSIONS[contentType];
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
    const path = `company-${context.companyId}/invoices/${name}`;

    const { error } = await context.supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "عکس فاکتور با موفقیت آپلود شد.",
      url: `/api/invoice?path=${encodeURIComponent(path)}`,
      path,
      fileName: name,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "خطا در آپلود عکس." },
      { status: 500 }
    );
  }
}
