"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Customer = { id: string; name: string; phone: string };
type Service = { id: string; name: string; price: number; duration: number };
type PaymentMethod = "card_terminal" | "cash" | "transfer";
type InvoicePaymentMethod = PaymentMethod | "mixed";
type Invoice = {
  id: string;
  number: string;
  customer: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paidAmount: number;
};

const toman = new Intl.NumberFormat("fa-IR");

export default function BusinessFinancePanel({
  businessId,
  customers,
  services,
}: {
  businessId: string;
  customers: Customer[];
  services: Service[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [quick, setQuick] = useState({
    customer: customers[0]?.name ?? "",
    service: services[0]?.name ?? "",
    amount: String(services[0]?.price ?? 0),
    method: "card_terminal" as PaymentMethod,
  });
  const [invoiceCustomer, setInvoiceCustomer] = useState(customers[0]?.name ?? "");
  const [invoiceItems, setInvoiceItems] = useState<{ serviceId: string; description: string; quantity: number; unitPrice: number }[]>([]);
  const [discount, setDiscount] = useState(0);
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState<InvoicePaymentMethod>("card_terminal");
  const [mixedCash, setMixedCash] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!businessId) return;
    let active = true;
    supabase
      .from("business_invoices")
      .select("id,invoice_number,subtotal,discount_amount,total_amount,paid_amount,status,business_customers(name)")
      .eq("business_id", businessId)
      .order("issued_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!active || !data) return;
        setInvoices(data.map((x: any) => ({
          id: x.id,
          number: x.invoice_number,
          customer: x.business_customers?.name ?? "مشتری",
          subtotal: Number(x.subtotal),
          discount: Number(x.discount_amount),
          total: Number(x.total_amount),
          status: x.status === "paid" ? "پرداخت شده" : "صادر شده",
          paidAmount: Number(x.paid_amount ?? 0),
        })));
      });
    return () => { active = false; };
  }, [businessId, supabase]);

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2400);
  }

  function addInvoiceItem(serviceId: string) {
    const service = services.find((x) => x.id === serviceId);
    if (!service) return;
    setInvoiceItems((items) => [...items, { serviceId: service.id, description: service.name, quantity: 1, unitPrice: service.price }]);
  }

  const subtotal = invoiceItems.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0);
  const safeDiscount = Math.max(0, Math.min(discount, subtotal));
  const total = subtotal - safeDiscount;

  async function recordQuickPayment() {
    const customer = customers.find((x) => x.name === quick.customer);
    const service = services.find((x) => x.name === quick.service);
    const amount = Number(quick.amount);
    if (!customer || !service || amount <= 0) return notify("مبلغ و اطلاعات پرداخت را کامل کنید.");

    const idempotencyKey = `quick:${businessId}:${customer.id}:${service.id}:${amount}:${quick.method}`;
    const { data, error } = await supabase.rpc("record_business_quick_payment", {
      p_business_id: businessId,
      p_customer_id: customer.id,
      p_service_id: service.id,
      p_appointment_id: null,
      p_location_id: null,
      p_amount: Math.round(amount),
      p_method: quick.method,
      p_currency: "IRR",
      p_reference: null,
      p_idempotency_key: idempotencyKey,
    });
    if (error || !data?.[0]) return notify("پرداخت ثبت نشد.");
    notify(`پرداخت ثبت شد · رسید ${data[0].receipt_number}`);
  }

  async function createInvoice() {
    const customer = customers.find((x) => x.name === invoiceCustomer);
    if (!customer || invoiceItems.length === 0 || total <= 0) return notify("مشتری و حداقل یک خدمت را انتخاب کنید.");

    const items = invoiceItems.map((item) => ({
      service_id: item.serviceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { data, error } = await supabase.rpc("create_business_invoice", {
      p_business_id: businessId,
      p_customer_id: customer.id,
      p_location_id: null,
      p_appointment_id: null,
      p_items: items,
      p_discount: Math.round(safeDiscount),
      p_notes: null,
    });

    if (error || !data?.[0]) return notify("صدور فاکتور انجام نشد.");

    const result = data[0];
    const next: Invoice = {
      id: result.invoice_id,
      number: result.invoice_number,
      customer: customer.name,
      subtotal: Number(result.subtotal),
      discount: Number(result.discount_amount),
      total: Number(result.total_amount),
      status: "صادر شده",
      paidAmount: 0,
    };
    setInvoices((items) => [next, ...items]);
    setInvoiceItems([]);
    setDiscount(0);
    notify(`فاکتور ${result.invoice_number} صادر شد.`);
  }

  async function payInvoice(invoice: Invoice, requestedAmount: number) {
    const due = Math.max(0, invoice.total - invoice.paidAmount);
    const amount = Math.max(0, Math.min(Math.round(requestedAmount), due));
    if (amount <= 0) return notify("مبلغ پرداخت معتبر نیست.");

    const cash = invoicePaymentMethod === "cash"
      ? amount
      : invoicePaymentMethod === "mixed"
        ? Math.max(0, Math.min(mixedCash, amount))
        : 0;
    const card = invoicePaymentMethod === "card_terminal"
      ? amount
      : amount - cash;

    const splits = [
      ...(cash > 0 ? [{ method: "cash", amount: cash }] : []),
      ...(card > 0 ? [{ method: "card_terminal", amount: card }] : []),
    ];
    if (!splits.length) return notify("روش پرداخت معتبر نیست.");

    const idempotencyKey = `invoice:${invoice.id}:${invoice.paidAmount + amount}:${splits.map((x) => x.method + "-" + x.amount).join(",")}`;
    const { data, error } = await supabase.rpc("record_business_invoice_payment", {
      p_business_id: businessId,
      p_invoice_id: invoice.id,
      p_payments: splits,
      p_idempotency_key: idempotencyKey,
    });

    if (error || !data?.[0]) return notify("پرداخت فاکتور ثبت نشد.");

    const result = data[0];
    setInvoices((items) => items.map((x) => x.id === invoice.id ? {
      ...x,
      status: result.status === "paid" ? "پرداخت شده" : "پرداخت ناقص",
      paidAmount: Number(result.paid_amount),
    } : x));
    notify(result.status === "paid" ? "فاکتور کامل تسویه شد." : "بخشی از فاکتور پرداخت شد.");
  }

  return (
    <div className="space-y-5">
      {message && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs font-bold text-emerald-200">{message}</div>}

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><span className="text-[10px] font-black text-cyan-300">تسویه سریع</span><h3 className="mt-1 font-black">پرداخت بدون فاکتور</h3></div>
          <span className="text-[10px] text-slate-500">کارتخوان پیش‌فرض است</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <select value={quick.customer} onChange={(e) => setQuick((x) => ({ ...x, customer: e.target.value }))} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{customers.map((x) => <option key={x.id}>{x.name}</option>)}</select>
          <select value={quick.service} onChange={(e) => { const s = services.find((x) => x.name === e.target.value); setQuick((x) => ({ ...x, service: e.target.value, amount: String(s?.price ?? x.amount) })); }} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{services.map((x) => <option key={x.id}>{x.name}</option>)}</select>
          <input inputMode="numeric" value={quick.amount} onChange={(e) => setQuick((x) => ({ ...x, amount: e.target.value }))} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm" placeholder="مبلغ" />
          <select value={quick.method} onChange={(e) => setQuick((x) => ({ ...x, method: e.target.value as PaymentMethod }))} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"><option value="card_terminal">کارتخوان</option><option value="cash">نقدی</option><option value="transfer">انتقال</option></select>
        </div>
        <button type="button" onClick={recordQuickPayment} className="mt-3 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">ثبت پرداخت</button>
      </section>

      <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.035] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><span className="text-[10px] font-black text-cyan-300">فاکتور اختیاری</span><h3 className="mt-1 font-black">صدور فاکتور برای مشتری</h3></div>
          <span className="text-xs text-slate-400">مشتری مجبور به دریافت فاکتور نیست</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_160px]">
          <select value={invoiceCustomer} onChange={(e) => setInvoiceCustomer(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{customers.map((x) => <option key={x.id}>{x.name}</option>)}</select>
          <div className="flex gap-2">
            <select defaultValue="" onChange={(e) => addInvoiceItem(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">
              <option value="">افزودن خدمت...</option>
              {services.map((x) => <option key={x.id} value={x.id}>{x.name} · {toman.format(x.price)}</option>)}
            </select>
            <span className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-bold text-slate-400">چند خدمت</span>
          </div>
          <input type="number" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm" placeholder="تخفیف" />
        </div>

        <div className="mt-4 space-y-2">
          {invoiceItems.map((item, index) => (
            <div key={`${item.serviceId}-${index}`} className="grid gap-2 rounded-2xl border border-white/10 p-3 sm:grid-cols-[1fr_110px_110px_auto] sm:items-center">
              <span className="text-xs font-bold">{item.description}</span>
              <input type="number" min="1" value={item.quantity} onChange={(e) => setInvoiceItems((items) => items.map((x, i) => i === index ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x))} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs" />
              <b className="text-xs">{toman.format(item.quantity * item.unitPrice)} ریال</b>
              <button type="button" onClick={() => setInvoiceItems((items) => items.filter((_, i) => i !== index))} className="rounded-xl border border-white/10 px-3 py-2 text-xs">حذف</button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 p-4"><span className="text-[10px] text-slate-500">جمع</span><b className="mt-1 block text-lg">{toman.format(subtotal)} ریال</b></div>
          <div className="rounded-2xl border border-white/10 p-4"><span className="text-[10px] text-slate-500">تخفیف</span><b className="mt-1 block text-lg">{toman.format(safeDiscount)} ریال</b></div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"><span className="text-[10px] text-cyan-300">قابل پرداخت</span><b className="mt-1 block text-xl">{toman.format(total)} ریال</b></div>
        </div>
        <button type="button" onClick={createInvoice} className="mt-4 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950">صدور فاکتور</button>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center justify-between"><div><span className="text-[10px] font-black text-slate-500">فاکتورهای صادرشده</span><h3 className="mt-1 font-black">مدیریت و تسویه</h3></div><span className="text-[10px] text-slate-500">{invoices.length} فاکتور</span></div>
        <div className="mt-4 space-y-2">
          {invoices.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">هنوز فاکتوری صادر نشده است.</div>}
          {invoices.map((invoice) => (
            <div key={invoice.id} className="grid gap-3 rounded-2xl border border-white/10 p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
              <div><b className="block text-sm">{invoice.number}</b><span className="text-[10px] text-slate-500">{invoice.customer}</span></div>
              <div className="text-xs">مبلغ: <b>{toman.format(invoice.total)} ریال</b></div>
              <div className="text-xs"><span>پرداخت: {toman.format(invoice.paidAmount)} ریال</span><br/><span>مانده: <b>{toman.format(Math.max(0, invoice.total - invoice.paidAmount))} ریال</b></span><br/><span>وضعیت: <b className="text-emerald-300">{invoice.status}</b></span></div>
              {invoice.paidAmount < invoice.total && <div className="flex flex-wrap gap-2 lg:justify-end">
                <select value={invoicePaymentMethod} onChange={(e) => setInvoicePaymentMethod(e.target.value as InvoicePaymentMethod)} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-[10px]"><option value="card_terminal">کارتخوان</option><option value="cash">نقدی</option><option value="mixed">ترکیبی</option></select>
                {invoicePaymentMethod === "mixed" && <input type="number" min="0" value={mixedCash} onChange={(e) => setMixedCash(Number(e.target.value) || 0)} placeholder="نقدی" className="w-24 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-[10px]" />}
                <input type="number" min="1" max={Math.max(1, invoice.total - invoice.paidAmount)} defaultValue={Math.max(1, invoice.total - invoice.paidAmount)} className="w-28 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-[10px]" aria-label="مبلغ پرداخت" data-payment-amount={invoice.id} />
                <button type="button" onClick={(event) => {
                  const input = event.currentTarget.parentElement?.querySelector<HTMLInputElement>(`[data-payment-amount="${invoice.id}"]`);
                  payInvoice(invoice, Number(input?.value || 0));
                }} className="rounded-xl bg-emerald-400 px-3 py-2 text-[10px] font-black text-slate-950">ثبت پرداخت</button>
              </div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
