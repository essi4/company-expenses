"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Purchase = { id: number; date: string; seller: string; description: string; amount: number; status: string; invoiceNumber: string };
type Mission = { id: number; documentNumber: string; issuedAt: string; totalPersonDays: number; status: string };
type Report = { monthKey: string; monthLabel: string; summary: { purchaseCount: number; purchaseTotal: number; missionCount: number; missionPersonDays: number; paymentCount: number; paymentTotal: number; balance: number }; purchases: Purchase[]; missions: Mission[] };

const money = (value: number) => new Intl.NumberFormat("fa-IR").format(Math.round(value || 0));
const statusLabel: Record<string, string> = { "ثبت شده": "ثبت شده", draft: "پیش‌نویس", review: "در حال بررسی", final: "نهایی", paid: "پرداخت‌شده", pending: "در انتظار تأیید", approved: "تأییدشده", rejected: "ردشده" };
const persianDate = (value: string) => {
  if (!value) return "—";
  const normalized = value.trim();
  if (/^1\d{3}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(normalized)) return normalized.replace(/[-.]/g, "/");
  const date = new Date(normalized.includes("T") ? normalized : normalized + "T00:00:00Z");
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(date);
};

export default function MonthPage({ params }: { params: { month: string } }) {
  const month = decodeURIComponent(params.month);
  const [tab, setTab] = useState<"invoices" | "missions">("invoices");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/reports?range=month&month=" + encodeURIComponent(month), { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || data.success === false) throw new Error(data.message || "خطا در دریافت ماه");
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات ماه");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [month]);

  if (loading) return <main dir="rtl" className="min-h-screen bg-slate-50 p-5 text-slate-900"><div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">در حال دریافت اطلاعات ماه…</div></main>;
  if (error || !report) return <main dir="rtl" className="min-h-screen bg-slate-50 p-5 text-slate-900"><div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p className="font-black text-red-600">{error || "اطلاعات ماه پیدا نشد."}</p><Link href="/" className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">بازگشت به ماه‌ها</Link></div></main>;

  const s = report.summary;
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 pb-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div><Link href="/" className="text-sm font-bold text-slate-500">← ماه‌ها</Link><h1 className="mt-1 text-2xl font-black">{report.monthLabel}</h1><p className="mt-1 text-sm text-slate-500">جزئیات مالی این ماه</p></div>
          <div className="flex gap-2"><Link href="/invoice-builder" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-slate-200">＋ فاکتور</Link><Link href="/mission-report" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">＋ مأموریت</Link></div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat title="فاکتورها" value={s.purchaseCount.toLocaleString("fa-IR")} />
          <Stat title="مأموریت‌ها" value={s.missionCount.toLocaleString("fa-IR")} />
          <Stat title="جمع فاکتورها" value={money(s.purchaseTotal) + " تومان"} />
          <Stat title="نفر-روز مأموریت" value={s.missionPersonDays.toLocaleString("fa-IR")} />
        </section>

        <section className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button onClick={() => setTab("invoices")} className={"rounded-xl px-4 py-3 text-sm font-black " + (tab === "invoices" ? "bg-white shadow-sm" : "text-slate-500")}>فاکتورها ({s.purchaseCount.toLocaleString("fa-IR")})</button>
            <button onClick={() => setTab("missions")} className={"rounded-xl px-4 py-3 text-sm font-black " + (tab === "missions" ? "bg-white shadow-sm" : "text-slate-500")}>مأموریت‌ها ({s.missionCount.toLocaleString("fa-IR")})</button>
          </div>

          {tab === "invoices" ? (
            <div className="mt-4 space-y-3">
              {report.purchases.length ? report.purchases.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black">{item.seller || "بدون فروشنده"}</h2><p className="mt-1 text-xs text-slate-500">{persianDate(item.date)}{item.invoiceNumber ? " • " + item.invoiceNumber : ""}</p></div><b className="whitespace-nowrap">{money(item.amount)} تومان</b></div><p className="mt-2 text-sm text-slate-600">{item.description || "بدون شرح"}</p><span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{statusLabel[item.status] || item.status}</span></article>) : <Empty text="در این ماه فاکتوری ثبت نشده است." />}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {report.missions.length ? report.missions.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black">گزارش مأموریت {item.documentNumber}</h2><p className="mt-1 text-xs text-slate-500">{persianDate(item.issuedAt)}</p></div><b className="whitespace-nowrap">{item.totalPersonDays.toLocaleString("fa-IR")} نفر-روز</b></div><span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{statusLabel[item.status] || item.status}</span></article>) : <Empty text="در این ماه گزارش مأموریتی ثبت نشده است." />}
            </div>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-3"><Stat title="پرداخت‌های ماه" value={money(s.paymentTotal) + " تومان"} /><Stat title="تعداد پرداخت" value={s.paymentCount.toLocaleString("fa-IR")} /><Stat title="مانده" value={money(Math.abs(s.balance)) + " تومان"} /></section>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-bold text-slate-500">{title}</p><b className="mt-2 block text-lg font-black">{value}</b></div>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">{text}</div>;
}