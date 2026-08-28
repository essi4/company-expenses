import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PurchaseBody = {
  id?: number | string;
  date?: string;
  seller?: string;
  description?: string;
  amount?: number | string;
  payment?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
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

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(
    2,
    "0"
  )}`;
}

function mapPurchase(item: any) {
  return {
    id: item.id,

    date: item.date ?? item.purchase_date ?? null,

    seller: item.seller ?? item.supplier ?? "",

    description: item.description ?? item.title ?? "",

    amount: normalizeAmount(item.amount),

    payment: item.payment ?? "",

    invoiceNumber: item.invoice_number ?? "",

    invoiceImage: item.invoice_image ?? "",

    notes: item.notes ?? "",

    status: item.status ?? "ثبت شده",

    createdAt: item.created_at ?? null,
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("purchases")
      .select(`
        id,
        date,
        seller,
        description,
        amount,
        payment,
        invoice_number,
        invoice_image,
        notes,
        status,
        title,
        supplier,
        purchase_date,
        created_at
      `)
      .order("id", { ascending: false });

    if (error) {
      console.error("GET purchases error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در دریافت خریدها",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapPurchase),
    });
  } catch (error) {
    console.error("GET purchases exception:", error);

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
    const body: PurchaseBody = await request.json();

    const {
      date,
      seller,
      description,
      amount,
      payment,
      invoiceNumber,
      invoiceImage,
      notes,
    } = body;

    const cleanSeller = seller
      ? String(seller).trim()
      : "";

    const cleanDescription = description
      ? String(description).trim()
      : "";

    if (!cleanSeller) {
      return NextResponse.json(
        {
          success: false,
          message: "نام فروشنده را وارد کنید.",
        },
        { status: 400 }
      );
    }

    if (!cleanDescription) {
      return NextResponse.json(
        {
          success: false,
          message: "شرح خرید را وارد کنید.",
        },
        { status: 400 }
      );
    }

    const numericAmount =
      normalizeAmount(amount);

    if (numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "مبلغ خرید صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const purchaseDate =
      normalizeDate(date) ||
      new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("purchases")
      .insert({
        // ستون‌های جدید
        title: cleanDescription,
        supplier: cleanSeller,
        category: "",
        purchase_date: purchaseDate,

        // ستون‌های مورد استفاده فرم فعلی
        date: purchaseDate,
        seller: cleanSeller,
        description: cleanDescription,
        amount: numericAmount,
        payment: payment
          ? String(payment).trim()
          : "کارت",
        invoice_number: invoiceNumber
          ? String(invoiceNumber).trim()
          : "",
        invoice_image: invoiceImage
          ? String(invoiceImage).trim()
          : "",
        notes: notes
          ? String(notes).trim()
          : "",
        status: "ثبت شده",
      })
      .select(`
        id,
        date,
        seller,
        description,
        amount,
        payment,
        invoice_number,
        invoice_image,
        notes,
        status,
        title,
        supplier,
        purchase_date,
        created_at
      `)
      .single();

    if (error) {
      console.error("POST purchases error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در ذخیره خرید",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "خرید با موفقیت ذخیره شد.",
        data: mapPurchase(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST purchases exception:",
      error
    );

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
    const body: PurchaseBody = await request.json();

    const {
      id,
      date,
      seller,
      description,
      amount,
      payment,
      invoiceNumber,
      invoiceImage,
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
          message: "شناسه خرید صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const cleanSeller = seller
      ? String(seller).trim()
      : "";

    const cleanDescription = description
      ? String(description).trim()
      : "";

    if (!cleanSeller) {
      return NextResponse.json(
        {
          success: false,
          message: "نام فروشنده را وارد کنید.",
        },
        { status: 400 }
      );
    }

    if (!cleanDescription) {
      return NextResponse.json(
        {
          success: false,
          message: "شرح خرید را وارد کنید.",
        },
        { status: 400 }
      );
    }

    const numericAmount =
      normalizeAmount(amount);

    if (numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "مبلغ خرید صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const purchaseDate =
      normalizeDate(date) ||
      new Date().toISOString().slice(0, 10);

    const { data: existing, error: findError } =
      await supabase
        .from("purchases")
        .select("id, invoice_image")
        .eq("id", numericId)
        .maybeSingle();

    if (findError) {
      console.error(
        "Check purchase error:",
        findError
      );

      return NextResponse.json(
        {
          success: false,
          message: "خطا در بررسی خرید",
          error: findError.message,
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "خرید پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const updateData: Record<
      string,
      unknown
    > = {
      title: cleanDescription,
      supplier: cleanSeller,
      category: "",
      purchase_date: purchaseDate,

      date: purchaseDate,
      seller: cleanSeller,
      description: cleanDescription,
      amount: numericAmount,
      payment: payment
        ? String(payment).trim()
        : "کارت",
      invoice_number: invoiceNumber
        ? String(invoiceNumber).trim()
        : "",
      notes: notes
        ? String(notes).trim()
        : "",
      status: "ثبت شده",
    };

    if (invoiceImage !== undefined) {
      updateData.invoice_image =
        invoiceImage
          ? String(invoiceImage).trim()
          : "";
    }

    const { data, error } =
      await supabase
        .from("purchases")
        .update(updateData)
        .eq("id", numericId)
        .select(`
          id,
          date,
          seller,
          description,
          amount,
          payment,
          invoice_number,
          invoice_image,
          notes,
          status,
          title,
          supplier,
          purchase_date,
          created_at
        `)
        .single();

    if (error) {
      console.error("PUT purchases error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "خطا در ویرایش خرید",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "خرید با موفقیت ویرایش شد.",
      data: mapPurchase(data),
    });
  } catch (error) {
    console.error(
      "PUT purchases exception:",
      error
    );

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
    const body: PurchaseBody =
      await request.json();

    const numericId = Number(body.id);

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "شناسه خرید صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const {
      data: existing,
      error: findError,
    } = await supabase
      .from("purchases")
      .select("id, invoice_image")
      .eq("id", numericId)
      .maybeSingle();

    if (findError) {
      console.error(
        "Find purchase error:",
        findError
      );

      return NextResponse.json(
        {
          success: false,
          message: "خطا در بررسی خرید",
          error: findError.message,
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "خرید پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const { error } =
      await supabase
        .from("purchases")
        .delete()
        .eq("id", numericId);

    if (error) {
      console.error(
        "DELETE purchase error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: "خطا در حذف خرید",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "خرید با موفقیت حذف شد.",
      image:
        existing.invoice_image || null,
    });
  } catch (error) {
    console.error(
      "DELETE purchases exception:",
      error
    );

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
