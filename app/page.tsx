"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Purchase = {
  id: number;
  date: string;
  seller: string;
  description: string;
  amount: number;
  payment: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  notes?: string;
  status: string;
};

type Payment = {
  id: number;
  date: string;
  title: string;
  amount: number;
  method: string;
  receiptImage?: string;
};

type Form = {
  date: string;
  seller: string;
  description: string;
  amount: string;
  payment: string;
  invoiceNumber: string;
  notes: string;
  invoiceImage: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const digits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
const money = (value: number) => new Intl.NumberFormat("fa-IR").format(Math.round(value || 0));

function div(a: number, b: number) {
  return Math.floor(a / b);
}

function mod(a: number, b: number) {
  return a - Math.floor(a / b) * b;
}

function jalaliToGregorian(jy: number, jm: number, jd: number) {
  jy += 1595;
  let days = -355668 + 365 * jy + div(jy, 33) * 8 + div((mod(jy, 33) + 3), 4) + jd;
  days += jm < 7 ? (jm - 1) * 31 : (jm - 1) * 30 + 6;

  let gy = 400 * div(days, 146097);
  days = mod(days, 146097);
  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days = mod(days, 36524);
    if (days >= 365) days++;
  }
  gy += 4 * div(days, 1461);
  days = mod(days, 1461);
  if (days > 365) {
    gy += div(days - 1, 365);
    days = mod(days - 1, 365);
  }

  const gd = days + 1;
  const leap = gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  let remaining = gd;
  while (gm <= 12 && remaining > monthDays[gm - 1]) {
    remaining -= monthDays[gm - 1];
    gm++;
  }
  return `${gy}-${String(gm).padStart(2, "0")}-${String(remaining).padStart(2, "0")}`;
}

function gregorianToJalali(gDate: string) {
  const [gy, gm, gd] = gDate.split("-").map(Number);
  if (!gy || !gm || !gd) return "";

  let gDayNo = 365 * (gy - 1600) + div(gy - 1600 + 3, 4) - div(gy - 1600 + 99, 100) + div(gy - 1600 + 399, 400);
  const gMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let i = 0; i < gm - 1; i++) gDayNo += gMonthDays[i];
  if (gm > 2 && (gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0))) gDayNo++;
  gDayNo += gd - 1;

  let jDayNo = gDayNo - 79;
  const jNp = div(jDayNo, 12053);
  jDayNo = mod(jDayNo, 12053);
  let jy = 979 + 33 * jNp + 4 * div(jDayNo, 1461);
  jDayNo = mod(jDayNo, 1461);
  if (jDayNo >= 366) {
    jy += div(jDayNo - 1, 365);
    jDayNo = mod(jDayNo - 1, 365);
  }

  let jm: number;
  if (jDayNo < 186) {
    jm = 1 + div(jDayNo, 31);
  } else {
    jm = 7 + div(jDayNo - 186, 30);
  }
  const jd = 1 + mod(jDayNo, jm <= 6 ? 31 : 30);
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

function parseJalali(value: string) {
  const clean = digits(value).replace(/[-.]/g, "/").replace(/\s+/g, "");
  const match = clean.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);
  if (jy < 1200 || jy > 1600 || jm < 1 || jm > 12 || jd < 1 || jd > (jm <= 6 ? 31 : jm <= 11 ? 30 : 30)) return null;
  return jalaliToGregorian(jy, jm, jd);
}

const empty = (): Form => ({
  date: today(),
  seller: "",
  description: "",
  amount: "",
  payment: "کارت",
  invoiceNumber: "",
  notes: "",
  invoiceImage: "",
});

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "خطا در ارتباط با سرور");
  }
  return data;
}

function PersianDateInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(gregorianToJalali(value));

  useEffect(() => {
    setText(gregorianToJalali(value));
  }, [value]);

  return (
    <input
      required
      type="text"
      inputMode="numeric"
      dir="ltr"
      value={text}
      onChange={(event) => {
        const next = digits(event.target.value).replace(/[^0-9/]/g, "");
        setText(next);
        const parsed = parseJalali(next);
        if (parsed) onChange(parsed);
      }}
      onBlur={() => setText(gregorianToJalali(value))}
      placeholder="۱۴۰۵/۰۶/۱۲"
      className="input text-center tracking-wider"
      aria-label="تاریخ شمسی"
    />
  );
}

export default function Home() {
  const [tab, setTab] = useState("dashboard");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(empty());
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [payment, setPayment] = useState({ date: today(), title: "", amount: "", method: "کارت" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [companyResponse, purchasesResponse, paymentsResponse] = await Promise.all([
        api("/api/company"),
        api("/api/purchases"),
        api("/api/payments"),
      ]);
      setCompany(companyResponse.data?.name || "");
      setPurchases(purchasesResponse.data || []);
      setPayments(paymentsResponse.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = purchases.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const balance = total - paid;
  const filtered = useMemo(() => {
    const query = digits(q).toLowerCase();
    return query
      ? purchases.filter((p) => `${p.seller} ${p.description} ${p.invoiceNumber || ""}`.toLowerCase().includes(query))
      : purchases;
  }, [purchases, q]);

  const upload = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    const response = await api("/api/upload", { method: "POST", body: data });
    return String(response.url || "");
  };

  const savePurchase = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/purchases", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: editing?.id,
          amount: digits(form.amount).replace(/[,٬]/g, ""),
        }),
      });
      setEditing(null);
      setForm(empty());
      await load();
      setTab("purchases");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت خرید ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("این خرید حذف شود؟")) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/purchases", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حذف ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  const savePayment = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payment,
          amount: digits(payment.amount).replace(/[,٬]/g, ""),
        }),
      });
      setPayment({ date: today(), title: "", amount: "", method: "کارت" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت پرداخت ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  const edit = (purchase: Purchase) => {
    setEditing(purchase);
    setForm({
      date: purchase.date || today(),
      seller: purchase.seller || "",
      description: purchase.description || "",
      amount: String(purchase.amount || ""),
      payment: purchase.payment || "کارت",
      invoiceNumber: purchase.invoiceNumber || "",
      notes: purchase.notes || "",
      invoiceImage: purchase.invoiceImage || "",
    });
    setTab("invoices");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-slate-500">مدیریت مالی شرکت</p>
            <h1 className="text-lg font-black">{company || "خرید و هزینه شرکت"}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-xl border px-3 py-2 text-sm font-bold">↻</button>
            <form action="/api/auth/signout" method="post">
              <button className="rounded-xl border px-3 py-2 text-sm font-bold">خروج</button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-4 px-4 pb-28 pt-5">
        {error && <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

        {tab === "dashboard" && (
          <>
            <div className="rounded-3xl bg-slate-900 p-6 text-white">
              <p className="text-sm text-slate-300">مانده حساب شرکت</p>
              <b className="mt-2 block text-3xl">{money(Math.abs(balance))}</b>
              <p className="mt-1 text-sm text-slate-300">{balance >= 0 ? "مانده بدهی خریدها" : "مازاد پرداخت‌ها"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card t="کل خریدها" v={money(total)} />
              <Card t="کل پرداخت‌ها" v={money(paid)} />
              <Card t="مانده" v={money(Math.abs(balance))} />
              <Card t="تعداد خرید" v={purchases.length.toLocaleString("fa-IR")} />
            </div>
          </>
        )}

        {tab === "purchases" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">خریدها</h2>
              <button onClick={() => { setEditing(null); setForm(empty()); setTab("invoices"); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">＋ ثبت خرید</button>
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 جستجوی فروشنده یا شرح" className="w-full rounded-xl border bg-white px-4 py-3" />
            {loading ? <Loading /> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((p) => (
                  <article key={p.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="flex justify-between gap-3">
                      <div>
                        <b>{p.seller}</b>
                        <p className="text-xs text-slate-500">{gregorianToJalali(p.date)} • {p.payment}</p>
                      </div>
                      <b>{money(p.amount)}</b>
                    </div>
                    <p className="mt-2 text-sm">{p.description}</p>
                    {p.invoiceImage && <img src={p.invoiceImage} alt="فاکتور" className="mt-3 max-h-48 w-full rounded-xl object-contain" />}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => edit(p)} className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-bold text-white">ویرایش</button>
                      <button onClick={() => remove(p.id)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600">حذف</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "invoices" && (
          <form onSubmit={savePurchase} className="space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex justify-between">
              <h2 className="text-xl font-black">{editing ? "ویرایش خرید" : "ثبت خرید جدید"}</h2>
              {editing && <button type="button" onClick={() => { setEditing(null); setTab("purchases"); }} className="text-sm font-bold">انصراف</button>}
            </div>
            <Field l="تاریخ خرید"><PersianDateInput value={form.date} onChange={(date) => setForm((f) => ({ ...f, date }))} /></Field>
            <p className="text-[11px] text-slate-400">تاریخ به صورت شمسی وارد می‌شود؛ مثال: ۱۴۰۵/۰۶/۱۲</p>
            <Field l="نام فروشنده"><input required value={form.seller} onChange={(e) => setForm((f) => ({ ...f, seller: e.target.value }))} className="input" /></Field>
            <Field l="شرح خرید"><input required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input" /></Field>
            <Field l="مبلغ"><input required inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field l="روش پرداخت"><select value={form.payment} onChange={(e) => setForm((f) => ({ ...f, payment: e.target.value }))} className="input"><option>کارت</option><option>نقدی</option><option>حساب بانکی</option><option>چک</option><option>نسیه</option></select></Field>
              <Field l="شماره فاکتور"><input value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} className="input" /></Field>
            </div>
            <Field l="یادداشت"><textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input min-h-24" /></Field>
            <Field l="تصویر فاکتور">
              <input type="file" accept="image/*" capture="environment" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await upload(file);
                  setForm((f) => ({ ...f, invoiceImage: url }));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "آپلود عکس ناموفق بود");
                }
              }} className="w-full rounded-xl border border-dashed p-3" />
              {form.invoiceImage && <img src={form.invoiceImage} alt="پیش‌نمایش فاکتور" className="mt-2 max-h-64 w-full rounded-xl object-contain" />}
            </Field>
            <button disabled={busy} className="w-full rounded-xl bg-slate-900 py-3.5 font-black text-white">{busy ? "در حال ذخیره…" : editing ? "ذخیره تغییرات" : "ثبت خرید"}</button>
          </form>
        )}

        {tab === "payments" && (
          <>
            <h2 className="text-xl font-black">پرداخت‌ها</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {payments.map((p) => (
                <article key={p.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="flex justify-between"><b>{p.title}</b><b>{money(p.amount)}</b></div>
                  <p className="mt-1 text-xs text-slate-500">{gregorianToJalali(p.date)} • {p.method}</p>
                </article>
              ))}
            </div>
            <form onSubmit={savePayment} className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <h3 className="font-black">ثبت پرداخت</h3>
              <PersianDateInput value={payment.date} onChange={(date) => setPayment((f) => ({ ...f, date }))} />
              <input required value={payment.title} onChange={(e) => setPayment((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="عنوان پرداخت" />
              <input required inputMode="decimal" value={payment.amount} onChange={(e) => setPayment((f) => ({ ...f, amount: e.target.value }))} className="input" placeholder="مبلغ" />
              <select value={payment.method} onChange={(e) => setPayment((f) => ({ ...f, method: e.target.value }))} className="input"><option>کارت</option><option>نقدی</option><option>حساب بانکی</option><option>چک</option></select>
              <button disabled={busy} className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white">ثبت پرداخت</button>
            </form>
          </>
        )}

        {tab === "more" && (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="font-black">حساب شرکت</h2>
            <p className="mt-2 text-sm text-slate-500">{company}</p>
            <p className="mt-4 text-sm">این حساب فقط به اطلاعات شرکت خودش دسترسی دارد.</p>
          </div>
        )}
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-2xl grid-cols-5 p-1">
          {[["dashboard", "داشبورد", "⌂"], ["purchases", "خریدها", "▣"], ["invoices", "ثبت خرید", "＋"], ["payments", "پرداخت‌ها", "◉"], ["more", "بیشتر", "•••"]].map(([id, label, icon]) => (
            <button key={id} onClick={() => id === "invoices" ? (setEditing(null), setForm(empty()), setTab("invoices")) : setTab(id)} className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-[11px] font-bold ${tab === id ? "bg-slate-100" : "text-slate-500"}`}>
              <span className="text-lg">{icon}</span>{label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function Card({ t, v }: { t: string; v: string }) {
  return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs text-slate-500">{t}</p><b className="mt-2 block text-lg">{v}</b></div>;
}

function Loading() {
  return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">در حال دریافت…</div>;
}

function Field({ l, children }: { l: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">{l}</span>{children}</label>;
}
