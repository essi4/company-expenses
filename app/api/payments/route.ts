import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PaymentBody = {
  id?: number | string;
  date?: string;
  title?: string;
  amount?: number | string;
  method?: string;
  description?: string;
  receiptImage?: string;
  notes?: string;
};

function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
  );
}

function normalizeAmount(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = toEnglishDigits(value)
      .replace(/,/g, "")
      .replace(/٬/g, "")
      .trim();

    const number = Number(normalized);

    return Number.isFinite(number) ? number : 0;
  }

  return 0;
}

function normalizeDate(value: unknown) {
  if (!value) return null;

  const text = toEnglishDigits(String(value).trim())
    .replace(/\//g, "-")
    .replace(/\./g, "-");

  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);

  if (!match) return null;

  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(
    2,
    "0"
  )}`;
}

function mapPayment(item: any) {
  return {
    id: item.id,
    date: item.date ?? item.payment_date ?? null,
    title: item.title ?? "",
    amount: normalizeAmount(item.amount),
    method: item.method ?? item.payment_method ?? "",
    description: item.description ?? "",
    receiptImage: item.receipt_image ?? "",
    notes: item.notes ?? "",
    createdAt: item.created_at ?? null,
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        date,
        title,
        amount,
        method,
        description,
        receipt_image,
        notes,
        payment_date,
        payment_method,
        created_at
      `)
      .order("id", { ascending: false });

    if (error) {
      console.error("GET payments error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در دریافت واریزها",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapPayment),
    });
  } catch (error) {
    console.error("GET payments exception:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ارتباط با سرور",
        error:
          error instanceof Error
            ? error.message
            : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(request: Request) {
  try {
    const body: PaymentBody = await request.json();

    const {
      date,
      title,
      amount,
      method,
      description,
      receiptImage,
      notes,
    } = body;

    const cleanTitle = title
      ? String(title).trim()
      : "";

    if (!cleanTitle) {
      return NextResponse.json(
        {
          success: false,
          message: "عنوان واریز را وارد کنید.",
        },
        { status: 400 }
      );
    }

    const numericAmount = normalizeAmount(amount);

    if (numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "مبلغ واریز صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const paymentDate =
      normalizeDate(date) ||
      new Date().toISOString().slice(0, 10);

    const cleanMethod = method
      ? String(method).trim()
      : "کارت";

    const { data, error } = await supabase
      .from("payments")
      .insert({
        title: cleanTitle,
        amount: numericAmount,

        date: paymentDate,
        payment_date: paymentDate,

        method: cleanMethod,
        payment_method: cleanMethod,

        description: description
          ? String(description).trim()
          : "",

        receipt_image: receiptImage
          ? String(receiptImage).trim()
          : "",

        notes: notes
          ? String(notes).trim()
          : "",
      })
      .select(`
        id,
        date,
        title,
        amount,
        method,
        description,
        receipt_image,
        notes,
        payment_date,
        payment_method,
        created_at
      `)
      .single();

    if (error) {
      console.error("POST payments error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در ذخیره واریز",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "واریز با موفقیت ذخیره شد.",
        data: mapPayment(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST payments exception:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ارتباط با سرور",
        error:
          error instanceof Error
            ? error.message
            : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
========================================================= */

export async function PUT(request: Request) {
  try {
    const body: PaymentBody = await request.json();

    const {
      id,
      date,
      title,
      amount,
      method,
      description,
      receiptImage,
      notes,
    } = body;

    const numericId = Number(id);

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "شناسه واریز صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const cleanTitle = title
      ? String(title).trim()
      : "";

    if (!cleanTitle) {
      return NextResponse.json(
        {
          success: false,
          message: "عنوان واریز را وارد کنید.",
        },
        { status: 400 }
      );
    }

    const numericAmount = normalizeAmount(amount);

    if (numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "مبلغ واریز صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const paymentDate =
      normalizeDate(date) ||
      new Date().toISOString().slice(0, 10);

    const cleanMethod = method
      ? String(method).trim()
      : "کارت";

    const { data: existing, error: findError } =
      await supabase
        .from("payments")
        .select("id, receipt_image")
        .eq("id", numericId)
        .maybeSingle();

    if (findError) {
      console.error("Check payment error:", findError);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در بررسی واریز",
          error: findError.message,
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "واریز پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      title: cleanTitle,
      amount: numericAmount,

      date: paymentDate,
      payment_date: paymentDate,

      method: cleanMethod,
      payment_method: cleanMethod,

      description: description
        ? String(description).trim()
        : "",

      notes: notes
        ? String(notes).trim()
        : "",
    };

    if (receiptImage !== undefined) {
      updateData.receipt_image = receiptImage
        ? String(receiptImage).trim()
        : "";
    }

    const { data, error } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", numericId)
      .select(`
        id,
        date,
        title,
        amount,
        method,
        description,
        receipt_image,
        notes,
        payment_date,
        payment_method,
        created_at
      `)
      .single();

    if (error) {
      console.error("PUT payments error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در ویرایش واریز",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "واریز با موفقیت ویرایش شد.",
      data: mapPayment(data),
    });
  } catch (error) {
    console.error("PUT payments exception:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ارتباط با سرور",
        error:
          error instanceof Error
            ? error.message
            : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(request: Request) {
  try {
    const body: PaymentBody =
      await request.json();

    const numericId = Number(body.id);

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "شناسه واریز صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const {
      data: existing,
      error: findError,
    } = await supabase
      .from("payments")
      .select("id, receipt_image")
      .eq("id", numericId)
      .maybeSingle();

    if (findError) {
      console.error("Find payment error:", findError);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در بررسی واریز",
          error: findError.message,
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "واریز پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", numericId);

    if (error) {
      console.error("DELETE payment error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در حذف واریز",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "واریز با موفقیت حذف شد.",
      image: existing.receipt_image || null,
    });
  } catch (error) {
    console.error("DELETE payments exception:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ارتباط با سرور",
        error:
          error instanceof Error
            ? error.message
            : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}

