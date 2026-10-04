"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type DocumentItem = {
  id: string;
  type: "invoice" | "mission";
  document_number: string;
  issued_at: string;
  month_key: string;
  status: string;
  title: string | null;
  total_amount: number;
  total_days: number;
};

const monthNames = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

function labelForMonth(key: string) {
  const [year, month] = key.split("-");
  const index = Number(month) - 1;
  if (!/^14\d{2}$/.test(year) || index < 0 || index > 11) return key;
  return `${monthNames[index]} ${year.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}`;
}

function statusLabel(status: string) {
  return {
    draft: "پیش‌نویس",
    review: "در حال بررسی",
    final: "نهایی",
    paid: "پرداخت‌شده",
    pending: "در انتظار",
    approved: "تأییدشده",
    rejected: "ردشده",
  }[status] ?? status;
}

export default function MonthPage() {
  const params = useParams<{ key: string }>();
  const monthKey = decodeURIComponent(params.key);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [tab, setTab] = useState<"invoice" | "mission">("invoice");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteDocument(item: DocumentItem) {
    const confirmed = window.confirm(`سند «${item.document_number}» حذف شود؟\nاین عمل قابل بازگشت نیست.`);
    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/documents?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "حذف سند ناموفق بود");
      setDocuments((current) => current.filter((doc) => doc.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای نامشخص در حذف سند");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/documents?month=${encodeURIComponent(monthKey)}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "دریافت ماه ناموفق بود");
        setDocuments(result.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطای نامشخص");
      } finally {
        setLoading(false);
      }
    })();
  }, [monthKey]);

  const visible = useMemo(() => documents.filter((item) => item.type === tab), [documents, tab]);
  const invoiceCount = documents.filter((item) => item.type === "invoice").length;
  const missionCount = documents.filter((item) => item.type === "mission").length;
  const invoiceTotal = documents.filter((item) => item.type === "invoice").reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const missionDays = documents.filter((item) => item.type === "mission").reduce((sum, item) => sum + Number(item.total_days || 0), 0);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <a href="/" className="text-sm font-bold text-slate-500">← داشبورد</a>
            <h1 className="mt-2 text-3xl font-black">{labelForMonth(monthKey)}</h1>
            <p className="mt-1 text-sm text-slate-500">{monthKey}</p>
          </div>
          <div className="flex gap-2">
            <a href="/invoice-builder" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">＋ فاکتور</a>
            <a href={`/mission-report?month=${encodeURIComponent(monthKey)}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-slate-200">＋ مأموریت</a>
          </div>
        </div>

        <section className="mb-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-xs font-bold text-slate-500">فاکتورها</div>
            <div className="mt-1 text-2xl font-black">{invoiceCount.toLocaleString("fa-IR")}</div>
            <div className="mt-1 text-sm text-emerald-700">{money(invoiceTotal)} تومان</div>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-xs font-bold text-slate-500">مأموریت‌ها</div>
            <div className="mt-1 text-2xl font-black">{missionCount.toLocaleString("fa-IR")}</div>
            <div className="mt-1 text-sm text-sky-700">{missionDays.toLocaleString("fa-IR")} نفر-روز</div>
          </div>
        </section>

        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-slate-200 p-1">
          <button onClick={() => setTab("invoice")} className={`rounded-xl px-4 py-3 text-sm font-black ${tab === "invoice" ? "bg-white shadow-sm" : "text-slate-500"}`}>
            فاکتورها · {invoiceCount.toLocaleString("fa-IR")}
          </button>
          <button onClick={() => setTab("mission")} className={`rounded-xl px-4 py-3 text-sm font-black ${tab === "mission" ? "bg-white shadow-sm" : "text-slate-500"}`}>
            مأموریت‌ها · {missionCount.toLocaleString("fa-IR")}
          </button>
        </div>

        {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">در حال دریافت…</div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <div className="text-3xl">{tab === "invoice" ? "🧾" : "🧭"}</div>
            <h2 className="mt-3 font-black">{tab === "invoice" ? "فاکتوری ثبت نشده" : "گزارش مأموریتی ثبت نشده"}</h2>
          </div>
        ) : (
          <div className="grid gap-3">
            {visible.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <a
                  href={item.type === "invoice" ? `/invoice-builder?id=${encodeURIComponent(item.id)}` : `/mission-report?id=${encodeURIComponent(item.id)}`}
                  className="block p-5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  aria-label={`باز کردن ${item.document_number}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-black">{item.document_number}</h2>
                      <p className="mt-1 text-sm text-slate-500">{item.issued_at} · {item.title || (item.type === "invoice" ? "فاکتور" : "گزارش مأموریت")}</p>
                    </div>
                    <div className="text-left">
                      {item.type === "invoice" ? (
                        <div className="font-black text-emerald-700">{money(Number(item.total_amount || 0))} تومان</div>
                      ) : (
                        <div className="font-black text-sky-700">{Number(item.total_days || 0).toLocaleString("fa-IR")} نفر-روز</div>
                      )}
                      <div className="mt-1 text-xs text-slate-500">{statusLabel(item.status)}</div>
                    </div>
                  </div>
                </a>
                <div className="border-t border-slate-100 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => deleteDocument(item)}
                    disabled={deletingId === item.id}
                    className="rounded-xl px-3 py-2 text-sm font-bold text-red-600 ring-1 ring-red-100 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === item.id ? "در حال حذف…" : "حذف"}
                  </button>
                </div>
              </div>
            ))}         </div>
        )}
      </div>
    </main>
  );
}
