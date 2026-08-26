import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const payments = db
      .prepare(`
        SELECT
          id,
          date,
          title,
          amount,
          method,
          description,
          receipt_image AS receiptImage,
          notes,
          created_at AS createdAt
        FROM payments
        ORDER BY id DESC
      `)
      .all();

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("GET payments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت واریزها",
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
      title,
      amount,
      method,
      description,
      receiptImage,
      notes,
    } = body;

    if (
      !title ||
      amount === undefined ||
      amount === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "عنوان و مبلغ واریز الزامی است.",
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
          message: "مبلغ واریز صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const result = db
      .prepare(`
        INSERT INTO payments (
          date,
          title,
          amount,
          method,
          description,
          receipt_image,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        date ||
          new Date()
            .toISOString()
            .slice(0, 10),

        String(title).trim(),

        numericAmount,

        method || "کارت",

        description
          ? String(description).trim()
          : "",

        receiptImage
          ? String(receiptImage).trim()
          : "",

        notes
          ? String(notes).trim()
          : ""
      );

    const payment = db
      .prepare(`
        SELECT
          id,
          date,
          title,
          amount,
          method,
          description,
          receipt_image AS receiptImage,
          notes,
          created_at AS createdAt
        FROM payments
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    return NextResponse.json(
      {
        success: true,
        message: "واریز با موفقیت ذخیره شد.",
        data: payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST payments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ذخیره واریز",
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

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "عنوان واریز الزامی است.",
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
          message: "مبلغ واریز صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const existing = db
      .prepare(`
        SELECT id
        FROM payments
        WHERE id = ?
      `)
      .get(numericId);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "واریز پیدا نشد.",
        },
        { status: 404 }
      );
    }

    let query = `
      UPDATE payments
      SET
        date = ?,
        title = ?,
        amount = ?,
        method = ?,
        description = ?,
        notes = ?
    `;

    const params: unknown[] = [
      date ||
        new Date()
          .toISOString()
          .slice(0, 10),

      String(title).trim(),

      numericAmount,

      method || "کارت",

      description
        ? String(description).trim()
        : "",

      notes
        ? String(notes).trim()
        : "",
    ];

    /*
      اگر receiptImage ارسال نشده باشد،
      عکس قبلی حفظ می‌شود.
    */
    if (receiptImage !== undefined) {
      query += `,
        receipt_image = ?
      `;

      params.push(
        receiptImage
          ? String(receiptImage).trim()
          : ""
      );
    }

    query += `
      WHERE id = ?
    `;

    params.push(numericId);

    db.prepare(query).run(...params);

    const payment = db
      .prepare(`
        SELECT
          id,
          date,
          title,
          amount,
          method,
          description,
          receipt_image AS receiptImage,
          notes,
          created_at AS createdAt
        FROM payments
        WHERE id = ?
      `)
      .get(numericId);

    return NextResponse.json({
      success: true,
      message: "واریز با موفقیت ویرایش شد.",
      data: payment,
    });
  } catch (error) {
    console.error("PUT payments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ویرایش واریز",
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
          message: "شناسه واریز صحیح نیست.",
        },
        { status: 400 }
      );
    }

    const existing = db
      .prepare(`
        SELECT receipt_image AS receiptImage
        FROM payments
        WHERE id = ?
      `)
      .get(id) as
      | { receiptImage?: string }
      | undefined;

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "واریز پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const result = db
      .prepare(
        "DELETE FROM payments WHERE id = ?"
      )
      .run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "حذف واریز انجام نشد.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "واریز با موفقیت حذف شد.",
      image: existing.receiptImage || null,
    });
  } catch (error) {
    console.error(
      "DELETE payment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "خطا در حذف واریز",
      },
      { status: 500 }
    );
  }
}