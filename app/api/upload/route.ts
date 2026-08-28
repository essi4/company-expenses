import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET_NAME = "invoice-images";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    // بررسی وجود فایل
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "فایل عکس انتخاب نشده است.",
        },
        { status: 400 }
      );
    }

    // بررسی فرمت فایل
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فرمت عکس مجاز نیست. فقط JPG، PNG، WEBP و GIF مجاز هستند.",
        },
        { status: 400 }
      );
    }

    // بررسی حجم فایل
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "حجم عکس نباید بیشتر از ۵ مگابایت باشد.",
        },
        { status: 400 }
      );
    }

    // تعیین پسوند
    const extensionMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

    const extension = extensionMap[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          message: "پسوند فایل معتبر نیست.",
        },
        { status: 400 }
      );
    }

    // ساخت نام یکتا
    const uniqueName = `${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}.${extension}`;

    // مسیر فایل در Storage
    const filePath = `invoices/${uniqueName}`;

    // تبدیل فایل به Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // آپلود به Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در آپلود عکس فاکتور.",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    // گرفتن لینک عمومی فایل
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      message: "عکس فاکتور با موفقیت آپلود شد.",
      url: publicUrl,
      path: filePath,
      fileName: uniqueName,
    });
  } catch (error) {
    console.error("Upload route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در آپلود عکس.",
        error:
          error instanceof Error
            ? error.message
            : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

