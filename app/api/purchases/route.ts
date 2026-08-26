import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const purchases = db
      .prepare(`
        SELECT
          id,
          date,
          seller,
          description,
          amount,
          payment,
          invoice_number AS invoiceNumber,
          invoice_image AS invoiceImage,
          notes,
          status,
          created_at AS createdAt
        FROM purchases
        ORDER BY id DESC
      `)
      .all();

    return NextResponse.json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    console.error("GET purchases error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت خریدها",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

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

    if (
      !seller ||
      !description ||
      amount === undefined ||
      amount === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فروشنده، شرح خرید و مبلغ الزامی است.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "مبلغ خرید صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const result = db
      .prepare(`
        INSERT INTO purchases (
          date,
          seller,
          description,
          amount,
          payment,
          invoice_number,
          invoice_image,
          notes,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        date ||
          new Date()
            .toISOString()
            .slice(0, 10),

        String(seller).trim(),

        String(description).trim(),

        numericAmount,

        payment || "کارت",

        invoiceNumber
          ? String(invoiceNumber).trim()
          : "",

        invoiceImage
          ? String(invoiceImage).trim()
          : "",

        notes
          ? String(notes).trim()
          : "",

        "ثبت شده"
      );

    const purchase = db
      .prepare(`
        SELECT
          id,
          date,
          seller,
          description,
          amount,
          payment,
          invoice_number AS invoiceNumber,
          invoice_image AS invoiceImage,
          notes,
          status,
          created_at AS createdAt
        FROM purchases
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    return NextResponse.json(
      {
        success: true,
        message: "خرید با موفقیت ذخیره شد.",
        data: purchase,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST purchases error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ذخیره خرید",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

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

    if (!seller || !description) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فروشنده و شرح خرید الزامی است.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "مبلغ خرید صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const existing = db
      .prepare(`
        SELECT id
        FROM purchases
        WHERE id = ?
      `)
      .get(numericId);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "خرید پیدا نشد.",
        },
        { status: 404 }
      );
    }

    /*
      اگر invoiceImage ارسال نشده باشد،
      عکس قبلی حفظ می‌شود.
    */
    let query = `
      UPDATE purchases
      SET
        date = ?,
        seller = ?,
        description = ?,
        amount = ?,
        payment = ?,
        invoice_number = ?,
        notes = ?
    `;

    const params: unknown[] = [
      date ||
        new Date()
          .toISOString()
          .slice(0, 10),

      String(seller).trim(),

      String(description).trim(),

      numericAmount,

      payment || "کارت",

      invoiceNumber
        ? String(invoiceNumber).trim()
        : "",

      notes
        ? String(notes).trim()
        : "",
    ];

    if (invoiceImage !== undefined) {
      query += `,
        invoice_image = ?
      `;

      params.push(
        invoiceImage
          ? String(invoiceImage).trim()
          : ""
      );
    }

    query += `
      WHERE id = ?
    `;

    params.push(numericId);

    db.prepare(query).run(...params);

    const purchase = db
      .prepare(`
        SELECT
          id,
          date,
          seller,
          description,
          amount,
          payment,
          invoice_number AS invoiceNumber,
          invoice_image AS invoiceImage,
          notes,
          status,
          created_at AS createdAt
        FROM purchases
        WHERE id = ?
      `)
      .get(numericId);

    return NextResponse.json({
      success: true,
      message: "خرید با موفقیت ویرایش شد.",
      data: purchase,
    });
  } catch (error) {
    console.error("PUT purchases error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ویرایش خرید",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "شناسه خرید صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const existing = db
      .prepare(`
        SELECT invoice_image AS invoiceImage
        FROM purchases
        WHERE id = ?
      `)
      .get(id) as
      | { invoiceImage?: string }
      | undefined;

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "خرید پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const result = db
      .prepare(
        "DELETE FROM purchases WHERE id = ?"
      )
      .run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "حذف خرید انجام نشد.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "خرید با موفقیت حذف شد.",
      image: existing.invoiceImage || null,
    });
  } catch (error) {
    console.error(
      "DELETE purchase error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "خطا در حذف خرید",
      },
      { status: 500 }
    );
  }
}