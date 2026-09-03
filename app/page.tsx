"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Purchase = {
  id: number;
  date: string;
  seller: string;
  description: string;
  amount: number;
  payment: string;
  invoiceNumber?: string | null;
  invoiceImage?: string | null;
  notes?: string | null;
  status: string;
};

type Payment = {
  id: number;
  date: string;
  title: string;
  amount: number;
  method: string;
  description?: string | null;
  receiptImage?: string | null;
  notes?: string | null;
};

type Tab = "dashboard" | "purchases" | "invoices" | "payments" | "more";

const nav = [
  ["dashboard", "داشبورد", "⌂"],
  ["purchases", "خریدها", "▣"],
  ["invoices", "فاکتورها", "▤"],
  ["payments", "پرداخت‌ها", "◉"],
  ["more", "بیشتر", "•••"],
] as const;

const money = (value: number) => new Intl.NumberFormat("fa-IR").format(Math.round(Number(value) || 0));
const today = () => new Date().toISOString().slice(0, 10);
const jalali = (value: string) => {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch {
    return value.replaceAll("-", "/");
  }
};

async function jsonRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || "خطا در ارتباط با سرور");
  return data;
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [purchaseForm, setPurchaseForm] = useState({ date: today(), seller: "", description: "", amount: "", payment: "کارت", invoiceNumber: "", notes: "", invoiceImage: "" });
  const [paymentForm, setPaymentForm] = useState({ date: today(), title: "", amount: "", method: "کارت", description: "", notes: "", receiptImage: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, v] = await Promise.all([jsonRequest("/api/purchases"), jsonRequest("/api/payments")]);
      setPurchases(p.data || []);
      setPayments(v.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const purchaseTotal = useMemo(() => purchases.reduce((sum, item) => sum + Number(item.amount || 0), 0), [purchases]);
  const paymentTotal = useMemo(() => payments.reduce((sum, item) => sum + Number(item.amount || 0), 0), [payments]);
  const balance = purchaseTotal - paymentTotal;

  const filteredPurchases = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter((p) => `${p.seller} ${p.description} ${p.invoiceNumber || ""}`.toLowerCase().includes(q));
  }, [purchases, query]);

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => `${p.title} ${p.method}`.toLowerCase().includes(q));
  }, [payments, query]);

  const uploadImage = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const data = await jsonRequest("/api/upload", { method: "POST", body: form });
    return data.url as string;
  };

  const submitPurchase = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await jsonRequest("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...purchaseForm, amount: purchaseForm.amount.replaceAll(",", "") }) });
      setPurchaseForm({ date: today(), seller: "", description: "", amount: "", payment: "کارت", invoiceNumber: "", notes: "", invoiceImage: "" });
      await load();
      setTab("purchases");
    } catch (e) { setError(e instanceof Error ? e.message : "ثبت خرید ناموفق بود"); }
    finally { setBusy(false); }
  };

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await jsonRequest("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...paymentForm, amount: paymentForm.amount.replaceAll(",", "") }) });
      setPaymentForm({ date: today(), title: "", amount: "", method: "کارت", description: "", notes: "", receiptImage: "" });
      await load();
      setTab("payments");
    } catch (e) { setError(e instanceof Error ? e.message : "ثبت پرداخت ناموفق بود"); }
    finally { setBusy(false); }
  };

  const removePurchase = async (id: number) => {
    if (!window.confirm("این خرید حذف شود؟")) return;
    setBusy(true);
    try { await jsonRequest("/api/purchases", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "حذف ناموفق بود"); }
    finally { setBusy(false); }
  };

  const removePayment = async (id: number) => {
    if (!window.confirm("این پرداخت حذف شود؟")) return;
    setBusy(true);
    try { await jsonRequest("/api/payments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "حذف ناموفق بود"); }
    finally { setBusy(false); }
  };

  const quickAdd = () => setTab("purchases");

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div><p className="text-xs text-slate-500">مدیریت مالی شرکت</p><h1 className="text-lg font-black sm:text-xl">خرید و هزینه شرکت</h1></div>
          <button onClick={load} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50" disabled={loading}>↻ <span className="hidden sm:inline">به‌روزرسانی</span></button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6">
        {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}<button onClick={() => setError("")} className="mr-3 underline">بستن</button></div>}

        {tab === "dashboard" && <Dashboard purchases={purchases} payments={payments} purchaseTotal={purchaseTotal} paymentTotal={paymentTotal} balance={balance} setTab={setTab} loading={loading} />}

        {tab === "purchases" && <section className="space-y-4">
          <PageTitle title="خریدها" subtitle={`${purchases.length.toLocaleString("fa-IR")} خرید ثبت شده`} action={<button onClick={() => setTab("invoices")} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">+ ثبت خرید</button>} />
          <Search value={query} onChange={setQuery} placeholder="جستجوی فروشنده، شرح یا شماره فاکتور" />
          {loading ? <Loading /> : filteredPurchases.length === 0 ? <Empty title="خریدی پیدا نشد" /> : <div className="grid gap-3 md:grid-cols-2">{filteredPurchases.map((p) => <PurchaseCard key={p.id} item={p} onDelete={() => removePurchase(p.id)} />)}</div>}
        </section>}

        {tab === "invoices" && <PurchaseForm form={purchaseForm} setForm={setPurchaseForm} onSubmit={submitPurchase} busy={busy} uploadImage={uploadImage} />}

        {tab === "payments" && <section className="space-y-4">
          <PageTitle title="پرداخت‌ها" subtitle={`${payments.length.toLocaleString("fa-IR")} پرداخت ثبت شده`} action={<button onClick={() => document.getElementById("payment-form")?.scrollIntoView({ behavior: "smooth" })} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">+ ثبت پرداخت</button>} />
          <Search value={query} onChange={setQuery} placeholder="جستجوی عنوان یا روش پرداخت" />
          {loading ? <Loading /> : filteredPayments.length === 0 ? <Empty title="پرداختی پیدا نشد" /> : <div className="grid gap-3 md:grid-cols-2">{filteredPayments.map((p) => <PaymentCard key={p.id} item={p} onDelete={() => removePayment(p.id)} />)}</div>}
          <PaymentForm form={paymentForm} setForm={setPaymentForm} onSubmit={submitPayment} busy={busy} uploadImage={uploadImage} />
        </section>}

        {tab === "more" && <section className="space-y-4"><PageTitle title="بیشتر" subtitle="ابزارهای مدیریت مالی" /><div className="grid gap-3 sm:grid-cols-2"><button onClick={() => setTab("dashboard")} className="rounded-2xl bg-white p-5 text-right shadow-sm ring-1 ring-slate-200"><b>📊 گزارش خلاصه</b><p className="mt-1 text-sm text-slate-500">جمع خریدها، پرداخت‌ها و مانده</p></button><button onClick={load} className="rounded-2xl bg-white p-5 text-right shadow-sm ring-1 ring-slate-200"><b>🔄 همگام‌سازی</b><p className="mt-1 text-sm text-slate-500">دریافت آخرین اطلاعات از پایگاه داده</p></button></div></section>}
      </section>

      <button aria-label="ثبت خرید سریع" onClick={quickAdd} className="fixed bottom-[76px] left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-2xl text-white shadow-xl sm:hidden">+</button>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[620px] sm:-translate-x-1/2 sm:rounded-2xl sm:border">
        <div className="mx-auto grid max-w-6xl grid-cols-5 px-1 py-1">
          {nav.map(([id, label, icon]) => <button key={id} onClick={() => { setTab(id); setQuery(""); }} className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-[11px] font-bold transition ${tab === id ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-50"}`}><span className="text-lg leading-5">{icon}</span><span>{label}</span></button>)}
        </div>
      </nav>
    </main>
  );
}

function Dashboard({ purchases, payments, purchaseTotal, paymentTotal, balance, setTab, loading }: { purchases: Purchase[]; payments: Payment[]; purchaseTotal: number; paymentTotal: number; balance: number; setTab: (tab: Tab) => void; loading: boolean }) {
  return <section className="space-y-4">
    <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-lg sm:p-7"><p className="text-sm text-slate-300">خلاصه مالی</p><div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-3xl font-black sm:text-4xl">{money(Math.abs(balance))}</p><p className="mt-1 text-sm text-slate-300">{balance >= 0 ? "مانده بدهی خریدها" : "مازاد پرداخت‌ها"}</p></div><button onClick={() => setTab("invoices")} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-900 sm:w-auto">+ ثبت خرید جدید</button></div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat title="کل خریدها" value={purchaseTotal} icon="🛒" /><Stat title="کل پرداخت‌ها" value={paymentTotal} icon="💳" /><Stat title="مانده" value={Math.abs(balance)} icon="◐" /><Stat title="تعداد خرید" value={purchases.length} icon="#" raw /></div>
    <div className="grid gap-4 lg:grid-cols-2"><ListPreview title="آخرین خریدها" items={purchases.slice(0, 5).map((p) => ({ title: p.seller || "فروشنده", sub: `${p.description} • ${jalali(p.date)}`, value: p.amount }))} action={() => setTab("purchases")} loading={loading} /><ListPreview title="آخرین پرداخت‌ها" items={payments.slice(0, 5).map((p) => ({ title: p.title, sub: `${p.method} • ${jalali(p.date)}`, value: p.amount }))} action={() => setTab("payments")} loading={loading} /></div>
  </section>;
}

function Stat({ title, value, icon, raw }: { title: string; value: number; icon: string; raw?: boolean }) { return <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><span className="text-xl">{icon}</span><p className="mt-3 text-xs text-slate-500">{title}</p><p className="mt-1 truncate text-lg font-black">{raw ? value.toLocaleString("fa-IR") : money(value)}{!raw && <span className="mr-1 text-[10px] font-medium text-slate-400">ریال</span>}</p></div>; }
function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) { return <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black sm:text-2xl">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{action}</div>; }
function Search({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <div className="relative"><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-11 text-sm outline-none ring-0 transition focus:border-slate-400" /><span className="pointer-events-none absolute right-4 top-3 text-lg text-slate-400">⌕</span></div>; }
function Loading() { return <div className="grid gap-3 md:grid-cols-2"><div className="h-28 animate-pulse rounded-2xl bg-slate-200" /><div className="h-28 animate-pulse rounded-2xl bg-slate-200" /></div>; }
function Empty({ title }: { title: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{title}</div>; }
function ListPreview({ title, items, action, loading }: { title: string; items: { title: string; sub: string; value: number }[]; action: () => void; loading: boolean }) { return <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><div className="mb-3 flex items-center justify-between"><h3 className="font-black">{title}</h3><button onClick={action} className="text-xs font-bold text-slate-500">مشاهده همه</button></div>{loading ? <Loading /> : items.length === 0 ? <Empty title="موردی ثبت نشده" /> : <div className="space-y-1">{items.map((x, i) => <div key={`${x.title}-${i}`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-slate-50"><div className="min-w-0"><p className="truncate text-sm font-bold">{x.title}</p><p className="truncate text-xs text-slate-400">{x.sub}</p></div><b className="shrink-0 text-sm">{money(x.value)}</b></div>)}</div>}</div>; }

function PurchaseCard({ item, onDelete }: { item: Purchase; onDelete: () => void }) { return <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-black">{item.seller}</h3><p className="mt-1 text-sm text-slate-500">{item.description}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold">{item.status || "ثبت شده"}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs"><div><span className="text-slate-400">تاریخ</span><p className="mt-1 font-bold">{jalali(item.date)}</p></div><div><span className="text-slate-400">مبلغ</span><p className="mt-1 font-black">{money(item.amount)} ریال</p></div></div>{item.invoiceImage && <a href={item.invoiceImage} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl bg-slate-100"><img src={item.invoiceImage} alt="فاکتور" className="h-32 w-full object-cover" loading="lazy" /></a>}<div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-400">{item.invoiceNumber ? `فاکتور ${item.invoiceNumber}` : item.payment}</span><button onClick={onDelete} className="rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">حذف</button></div></article>; }
function PaymentCard({ item, onDelete }: { item: Payment; onDelete: () => void }) { return <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.method}</p></div><p className="text-lg font-black">{money(item.amount)} <span className="text-[10px] text-slate-400">ریال</span></p></div><div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{jalali(item.date)}{item.description ? ` • ${item.description}` : ""}</div>{item.receiptImage && <a href={item.receiptImage} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl bg-slate-100"><img src={item.receiptImage} alt="رسید پرداخت" className="h-32 w-full object-cover" loading="lazy" /></a>}<div className="mt-3 text-left"><button onClick={onDelete} className="rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">حذف</button></div></article>; }

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) { return <label className={full ? "block sm:col-span-2" : "block"}><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>{children}</label>; }
const inputClass = "h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400";

function PurchaseForm({ form, setForm, onSubmit, busy, uploadImage }: { form: any; setForm: (value: any) => void; onSubmit: (event: FormEvent) => void; busy: boolean; uploadImage: (file: File) => Promise<string> }) {
  const patch = (key: string, value: string) => setForm({ ...form, [key]: value });
  const [uploading, setUploading] = useState(false);
  return <section className="mx-auto max-w-3xl space-y-4"><PageTitle title="ثبت خرید" subtitle="فرم مخصوص موبایل، با فاکتور و تصویر" /><form onSubmit={onSubmit} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="تاریخ خرید"><input type="date" value={form.date} onChange={(e) => patch("date", e.target.value)} className={inputClass} /></Field><Field label="فروشنده"><input required value={form.seller} onChange={(e) => patch("seller", e.target.value)} placeholder="نام فروشنده" className={inputClass} /></Field><Field label="شرح خرید" full><input required value={form.description} onChange={(e) => patch("description", e.target.value)} placeholder="مثلاً خرید لوازم اداری" className={inputClass} /></Field><Field label="مبلغ (ریال)"><input required inputMode="numeric" value={form.amount} onChange={(e) => patch("amount", e.target.value)} placeholder="مبلغ را وارد کنید" className={inputClass} /></Field><Field label="روش پرداخت"><select value={form.payment} onChange={(e) => patch("payment", e.target.value)} className={inputClass}><option>کارت</option><option>نقدی</option><option>حساب شرکت</option><option>چک</option><option>سایر</option></select></Field><Field label="شماره فاکتور"><input value={form.invoiceNumber} onChange={(e) => patch("invoiceNumber", e.target.value)} className={inputClass} /></Field><Field label="تصویر فاکتور"><input type="file" accept="image/*" capture="environment" disabled={uploading} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { patch("invoiceImage", await uploadImage(file)); } catch { alert("آپلود تصویر ناموفق بود"); } finally { setUploading(false); } }} className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs" />{form.invoiceImage && <span className="mt-1 block text-xs font-bold text-emerald-600">✓ تصویر آپلود شد</span>}</Field><Field label="یادداشت" full><textarea value={form.notes} onChange={(e) => patch("notes", e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400" /></Field></div><button disabled={busy || uploading} className="mt-5 h-12 w-full rounded-xl bg-slate-900 font-black text-white disabled:opacity-50">{busy ? "در حال ذخیره…" : "ثبت خرید"}</button></form></section>;
}

function PaymentForm({ form, setForm, onSubmit, busy, uploadImage }: { form: any; setForm: (value: any) => void; onSubmit: (event: FormEvent) => void; busy: boolean; uploadImage: (file: File) => Promise<string> }) {
  const patch = (key: string, value: string) => setForm({ ...form, [key]: value });
  const [uploading, setUploading] = useState(false);
  return <form id="payment-form" onSubmit={onSubmit} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"><h3 className="text-lg font-black">ثبت پرداخت جدید</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="تاریخ"><input type="date" value={form.date} onChange={(e) => patch("date", e.target.value)} className={inputClass} /></Field><Field label="عنوان"><input required value={form.title} onChange={(e) => patch("title", e.target.value)} placeholder="مثلاً پرداخت به فروشنده" className={inputClass} /></Field><Field label="مبلغ (ریال)"><input required inputMode="numeric" value={form.amount} onChange={(e) => patch("amount", e.target.value)} className={inputClass} /></Field><Field label="روش پرداخت"><select value={form.method} onChange={(e) => patch("method", e.target.value)} className={inputClass}><option>کارت</option><option>نقدی</option><option>حساب شرکت</option><option>چک</option><option>سایر</option></select></Field><Field label="تصویر رسید"><input type="file" accept="image/*" capture="environment" disabled={uploading} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { patch("receiptImage", await uploadImage(file)); } catch { alert("آپلود تصویر ناموفق بود"); } finally { setUploading(false); } }} className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs" />{form.receiptImage && <span className="mt-1 block text-xs font-bold text-emerald-600">✓ تصویر آپلود شد</span>}</Field><Field label="توضیحات"><input value={form.description} onChange={(e) => patch("description", e.target.value)} className={inputClass} /></Field></div><button disabled={busy || uploading} className="mt-5 h-12 w-full rounded-xl bg-slate-900 font-black text-white disabled:opacity-50">{busy ? "در حال ذخیره…" : "ثبت پرداخت"}</button></form>;
}
