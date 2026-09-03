import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";

export const dynamic = "force-dynamic";

const fields: Record<string, string[]> = {
  suppliers: ["name", "phone", "contact", "notes"],
  categories: ["name", "kind"],
  accounts: ["name", "kind", "opening_balance"],
  budgets: ["title", "category", "amount", "start_date", "end_date"],
  checks: ["check_no", "kind", "party", "amount", "issue_date", "due_date", "status", "notes"],
  purchase_items: ["purchase_id", "description", "quantity", "unit_price"],
};
const allowed = new Set(Object.keys(fields));

function cleanBody(type: string, input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of fields[type]) if (input[key] !== undefined) out[key] = input[key];
  return out;
}

function validate(type: string, body: Record<string, unknown>) {
  const required: Record<string, string[]> = {
    suppliers: ["name"], categories: ["name", "kind"], accounts: ["name", "kind"],
    budgets: ["title", "amount", "start_date", "end_date"],
    checks: ["check_no", "kind", "amount", "status"],
    purchase_items: ["purchase_id", "description", "quantity", "unit_price"],
  };
  for (const key of required[type] || []) {
    if (body[key] === undefined || body[key] === null || String(body[key]).trim() === "") return `فیلد «${key}» الزامی است`;
  }
  for (const key of ["amount", "opening_balance", "quantity", "unit_price", "purchase_id"]) {
    if (body[key] !== undefined && (!Number.isFinite(Number(body[key])) || Number(body[key]) < 0)) return `مقدار «${key}» نامعتبر است`;
  }
  return null;
}

export async function GET(req: Request) {
  const c = await getCompanyContext();
  if (!c.companyId) return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  const type = new URL(req.url).searchParams.get("type") || "";
  if (!allowed.has(type)) return NextResponse.json({ success: false, message: "نوع نامعتبر" }, { status: 400 });
  const { data, error } = await c.supabase.from(type).select("*").eq("company_id", c.companyId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const c = await getCompanyContext();
  if (!c.companyId) return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  const input = await req.json();
  const type = String(input.type || "");
  if (!allowed.has(type)) return NextResponse.json({ success: false, message: "نوع نامعتبر" }, { status: 400 });
  const body = cleanBody(type, input);
  const validation = validate(type, body);
  if (validation) return NextResponse.json({ success: false, message: validation }, { status: 400 });
  const { data, error } = await c.supabase.from(type).insert({ ...body, company_id: c.companyId }).select().single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  return NextResponse.json({ success: true, data });
}

export async function PUT(req: Request) {
  const c = await getCompanyContext();
  if (!c.companyId) return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  const input = await req.json();
  const type = String(input.type || "");
  const id = Number(input.id);
  if (!allowed.has(type) || !Number.isInteger(id) || id < 1) return NextResponse.json({ success: false, message: "ورودی نامعتبر" }, { status: 400 });
  const body = cleanBody(type, input);
  const validation = validate(type, body);
  if (validation) return NextResponse.json({ success: false, message: validation }, { status: 400 });
  const { data, error } = await c.supabase.from(type).update(body).eq("id", id).eq("company_id", c.companyId).select().single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: Request) {
  const c = await getCompanyContext();
  if (!c.companyId) return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  const input = await req.json();
  const type = String(input.type || "");
  const id = Number(input.id);
  if (!allowed.has(type) || !Number.isInteger(id) || id < 1) return NextResponse.json({ success: false, message: "ورودی نامعتبر" }, { status: 400 });
  const { error } = await c.supabase.from(type).delete().eq("id", id).eq("company_id", c.companyId);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
