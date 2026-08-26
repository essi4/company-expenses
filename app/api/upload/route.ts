import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "فایل عکس انتخاب نشده است.",
        },
        { status: 400 }
      );
    }

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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "حجم عکس نباید بیشتر از ۱۰ مگابایت باشد.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(uploadDir, {
      recursive: true,
    });

    const extension =
      file.type === "image/jpeg"
        ? ".jpg"
        : file.type === "image/png"
        ? ".png"
        : file.type === "image/webp"
        ? ".webp"
        : ".gif";

    const filename =
      `${Date.now()}-${crypto.randomBytes(8).toString("hex")}` +
      extension;

    const filepath = path.join(
      uploadDir,
      filename
    );

    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      message: "عکس با موفقیت آپلود شد.",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در آپلود عکس.",
      },
      { status: 500 }
    );
  }
}