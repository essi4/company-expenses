"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { calculateInvoiceTotals, type InvoiceEntry, type InvoiceStatus } from "../../lib/invoice";
import { generateDocumentNumber, nextTemporarySequence } from "../../lib/document-number";

type Row = {
  id: number;
  date: string;
  description: string;
  amount: string;
};

type SignatureData = { image: string; name: string; signedAt: string };

type Draft = {
  company: string;
  title: string;
  invoiceNo: string;
  issueDate: string;
  received: string;
  status: InvoiceStatus;
  buyer: string;
  note: string;
  rows: Row[];
  signature: SignatureData;
};

const DRAFT_KEY = "company-expenses:invoice-builder:draft:v1";

const money = (value: number) => new Intl.NumberFormat("fa-IR").format(Math.round(value || 0));

const digits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const emptyRow = (id: number): Row => ({
  id,
  date: "۱۴۰۵/۰۷/۱۰",
  description: "",
  amount: "",
});

const initialRows: Row[] = [
  { id: 1, date: "۱۴۰۵/۰۶/۰۷", description: "ناهار تل بارگاه", amount: "۷۰۰۰۰۰" },
  { id: 2, date: "۱۴۰۵/۰۶/۱۱", description: "ناهار سایت چاه ماهی", amount: "۱۱۶۰۰۰۰" },
  { id: 3, date: "۱۴۰۵/۰۶/۱۶", description: "ناهار تل بارگاه", amount: "۷۰۰۰۰۰" },
  { id: 4, date: "۱۴۰۵/۰۶/۱۷", description: "باطری قلم نوری", amount: "۲۵۰۰۰۰" },
  { id: 5, date: "۱۴۰۵/۰۶/۲۶", description: "کاغذ A4", amount: "۱۰۰۰۰۰۰" },
  { id: 6, date: "۱۴۰۵/۰۶/۳۱", description: "ناهار لایزنگان", amount: "۵۵۰۰۰۰" },
  { id: 7, date: "۱۴۰۵/۰۶/۳۱", description: "پر کردن پیک‌نیک", amount: "۳۰۰۰۰۰" },
  { id: 8, date: "۱۴۰۵/۰۷/۰۱", description: "خودرو ابراهیم رستگار", amount: "۲۰۰۰۰۰۰" },
  { id: 9, date: "۱۴۰۵/۰۷/۱۰", description: "کاغذ A4", amount: "۱۱۰۰۰۰۰" },
];

const defaultDraft: Draft = {
  company: "شرکت عرضه ساره لب رود",
  title: "صورت‌حساب و فاکتور هزینه‌های اجرایی و تجهیزات",
  invoiceNo: "ASL-1405-083",
  issueDate: "۱۴۰۵/۰۷/۱۰",
  received: "۴۰۰۰۰۰۰",
  status: "review",
  buyer: "واحد / پروژه دریافت‌کننده",
  note: "",
  rows: initialRows,
  signature: { image: "", name: "", signedAt: "" },
};

export default function InvoiceBuilderPage() {
  const [company, setCompany] = useState(defaultDraft.company);
  const [title, setTitle] = useState(defaultDraft.title);
  const [invoiceNo, setInvoiceNo] = useState(defaultDraft.invoiceNo);
  const [issueDate, setIssueDate] = useState(defaultDraft.issueDate);
  const [received, setReceived] = useState(defaultDraft.received);
  const [status, setStatus] = useState<InvoiceStatus>(defaultDraft.status);
  const [buyer, setBuyer] = useState(defaultDraft.buyer);
  const [note, setNote] = useState(defaultDraft.note);
  const [rows, setRows] = useState<Row[]>(defaultDraft.rows);
  const [signature, setSignature] = useState<SignatureData>(defaultDraft.signature);
  const [isEditing, setIsEditing] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<Draft>(defaultDraft);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const invoiceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      if (!draft || !Array.isArray(draft.rows)) return;
      setCompany(draft.company);
      setTitle(draft.title);
      setInvoiceNo(draft.invoiceNo);
      setIssueDate(draft.issueDate);
      setReceived(draft.received);
      setStatus(draft.status);
      setBuyer(draft.buyer);
      setNote(draft.note ?? "");
      setRows(draft.rows);
      setSignature(draft.signature ?? defaultDraft.signature);
      setSavedSnapshot({ ...draft, note: draft.note ?? "", signature: draft.signature ?? defaultDraft.signature });
      setHasLocalDraft(true);
      setMessage("پیش‌نویس ذخیره‌شده محلی بازیابی شد.");
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const snapshot = (): Draft => ({
    company,
    title,
    invoiceNo,
    issueDate,
    received,
    status,
    buyer,
    note,
    rows,
    signature,
  });

  const startEditing = () => {
    setSavedSnapshot(snapshot());
    setIsEditing(true);
    setMessage("");
  };

  const cancelEditing = () => {
    const draft = savedSnapshot;
    setCompany(draft.company);
    setTitle(draft.title);
    setInvoiceNo(draft.invoiceNo);
    setIssueDate(draft.issueDate);
    setReceived(draft.received);
    setStatus(draft.status);
    setBuyer(draft.buyer);
    setNote(draft.note ?? "");
    setRows(draft.rows);
    setSignature(draft.signature ?? defaultDraft.signature);
    setIsEditing(false);
    setMessage("تغییرات ذخیره‌نشده لغو شد.");
  };

  const saveDraft = () => {
    const draft = snapshot();
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setSavedSnapshot(draft);
    setHasLocalDraft(true);
    setIsEditing(false);
    setMessage("فاکتور در این دستگاه ذخیره شد.");
  };

  const updateSignature = (patch: Partial<SignatureData>) =>
    setSignature((current) => ({ ...current, ...patch }));

  const clearSignature = () => updateSignature({ image: "", signedAt: "" });

  const clearLocalDraft = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setHasLocalDraft(false);
    setMessage("پیش‌نویس محلی پاک شد؛ اطلاعات فعلی صفحه حفظ شده است.");
  };

  const invoiceEntries = useMemo<InvoiceEntry[]>(
    () => [
      {
        id: "deposit-1",
        kind: "deposit",
        date: issueDate,
        description: "مبلغ دریافتی شرکت",
        amount: Number(digits(received).replace(/[,٬]/g, "") || 0),
      },
      ...rows.map((row) => ({
        id: String(row.id),
        kind: "expense" as const,
        date: row.date,
        description: row.description,
        amount: Number(digits(row.amount).replace(/[,٬]/g, "") || 0),
      })),
    ],
    [issueDate, received, rows],
  );

  const totals = useMemo(() => calculateInvoiceTotals(invoiceEntries), [invoiceEntries]);
  const receivedValue = totals.totalDeposit;
  const total = totals.totalExpense;
  const balance = totals.balance;

  const updateRow = (id: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () =>
    setRows((current) => [...current, emptyRow(Math.max(0, ...current.map((row) => row.id)) + 1)]);

  const removeRow = (id: number) => setRows((current) => current.filter((row) => row.id !== id));

  const generateNextDocumentNumber = () => {
    const sequence = nextTemporarySequence(1405, "ASL");
    setInvoiceNo(generateDocumentNumber(1405, sequence, "ASL"));
    setMessage("شماره موقت جدید تولید شد.");
  };

  const exportImage = async () => {
    if (!invoiceRef.current || isEditing) return;
    setExporting(true);
    document.body.classList.add("document-export");
    try {
      const dataUrl = await toPng(invoiceRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${invoiceNo || "invoice"}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      document.body.classList.remove("document-export");
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    if (!invoiceRef.current || isEditing) return;
    setExporting(true);
    document.body.classList.add("document-export");
    try {
      const dataUrl = await toPng(invoiceRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const imageWidth = pageWidth - margin * 2;
      const imageHeight = (invoiceRef.current.scrollHeight / invoiceRef.current.scrollWidth) * imageWidth;
      const usableHeight = pageHeight - margin * 2;
      let offset = 0;
      while (offset < imageHeight) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", margin, margin - offset, imageWidth, imageHeight, undefined, "FAST");
        offset += usableHeight;
      }
      pdf.save(`${invoiceNo || "invoice"}.pdf`);
    } finally {
      document.body.classList.remove("document-export");
      setExporting(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-5 print:max-w-none print:px-0 print:py-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <p className="text-xs font-bold text-slate-500">مدیریت مالی شرکت</p>
            <h1 className="text-2xl font-black">سازنده فاکتور</h1>
            <p className="mt-1 text-xs text-slate-500">
              {hasLocalDraft ? "پیش‌نویس محلی موجود است" : "فاکتور جدید"}
              {message ? ` · ${message}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => (window.location.href = "/")} className="rounded-xl bg-white px-4 py-2 font-bold ring-1 ring-slate-200">
              ← داشبورد
            </button>
            {!isEditing ? (
              <button onClick={startEditing} className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-white">
                ✏️ ویرایش فاکتور
              </button>
            ) : (
              <>
                <button onClick={saveDraft} className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white">
                  💾 ذخیره موقت
                </button>
                <button onClick={cancelEditing} className="rounded-xl bg-white px-4 py-2 font-bold ring-1 ring-slate-200">
                  ↩ لغو ویرایش
                </button>
              </>
            )}
            <button
              onClick={exportPdf}
              disabled={exporting || isEditing}
              title={isEditing ? "ابتدا تغییرات را ذخیره کنید" : "خروجی PDF"}
              className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-40"
            >
              {exporting ? "در حال آماده‌سازی…" : "📄 PDF"}
            </button>
            <button
              onClick={exportImage}
              disabled={exporting || isEditing}
              title={isEditing ? "ابتدا تغییرات را ذخیره کنید" : "خروجی تصویر"}
              className="rounded-xl bg-sky-700 px-4 py-2 font-bold text-white disabled:opacity-40"
            >
              🖼 تصویر
            </button>
            {isEditing && (
              <button onClick={addRow} className="rounded-xl bg-white px-4 py-2 font-bold ring-1 ring-slate-200">
                ＋ ردیف هزینه
              </button>
            )}
            <button
              onClick={() => window.print()}
              disabled={isEditing}
              className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-40"
            >
              🖨 چاپ / ذخیره PDF
            </button>
          </div>
        </div>

        {isEditing && (
          <section className="mb-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 print:hidden sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="label">نام شرکت</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">شماره سند</span>
              <div className="flex gap-2">
                <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="input" />
                <button type="button" onClick={generateNextDocumentNumber} className="shrink-0 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">
                  شماره جدید
                </button>
              </div>
            </label>
            <label className="block">
              <span className="label">تاریخ صدور</span>
              <input value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">وضعیت</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)} className="input">
                <option value="draft">پیش‌نویس</option>
                <option value="review">در حال بررسی</option>
                <option value="final">نهایی</option>
                <option value="paid">پرداخت‌شده</option>
              </select>
            </label>
            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="label">عنوان فاکتور</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">دریافت‌کننده / پروژه</span>
              <input value={buyer} onChange={(e) => setBuyer(e.target.value)} className="input" />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">مبلغ دریافتی شرکت (تومان)</span>
              <input inputMode="numeric" value={received} onChange={(e) => setReceived(e.target.value)} className="input" />
            </label>
            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="label">توضیحات / یادداشت</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input min-h-20 resize-y" placeholder="اگر لازم است توضیح یا مورد دیگری به فاکتور اضافه شود، اینجا بنویسید." />
            </label>
          </section>
        )}

        <article ref={invoiceRef} className="invoice-paper bg-white p-5 shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0 sm:p-8">
          <header className="flex flex-col gap-4 border-b-2 border-slate-900 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{company}</h2>
              <p className="mt-1 text-sm font-bold text-slate-600">{title}</p>
              <p className="mt-1 text-xs text-slate-500">دریافت‌کننده: {buyer}</p>
            </div>
            <div className="text-sm leading-7 text-slate-600 sm:text-left">
              <div>شماره سند: <b className="text-slate-900">{invoiceNo}</b></div>
              <div>تاریخ صدور: <b className="text-slate-900">{issueDate}</b></div>
              <div>وضعیت: <b className="text-slate-900">{statusLabel(status)}</b></div>
            </div>
          </header>

          <div className="my-5 grid gap-3 sm:grid-cols-3">
            <Summary label="مبلغ دریافتی شرکت" value={money(receivedValue)} />
            <Summary label="جمع کل هزینه‌ها" value={money(total)} />
            <Summary label="مانده طلب تنخواه‌دار" value={money(balance)} highlight />
          </div>

          {note.trim() && (
            <section className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-black text-slate-700">توضیحات / یادداشت</div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note}</p>
            </section>
          )}

          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-base font-black">ریز هزینه‌ها و خریدهای انجام‌شده</div>
            {!isEditing && <span className="text-xs text-slate-400">برای تغییر اطلاعات، «ویرایش فاکتور» را بزنید.</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm invoice-table">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border p-2">ردیف</th>
                  <th className="border p-2">تاریخ</th>
                  <th className="border p-2 text-right">شرح کالا / هزینه</th>
                  <th className="border p-2 text-left">مبلغ (تومان)</th>
                  <th className="w-10 border p-2 print:hidden" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td data-label="ردیف" className="border p-2 text-center">{(index + 1).toLocaleString("fa-IR")}</td>
                    <td data-label="تاریخ" className="border p-1">
                      {isEditing ? (
                        <input value={row.date} onChange={(e) => updateRow(row.id, { date: e.target.value })} className="w-full bg-transparent p-1 text-center outline-none" />
                      ) : (
                        <span className="block p-1 text-center">{row.date}</span>
                      )}
                    </td>
                    <td data-label="شرح" className="border p-1">
                      {isEditing ? (
                        <input value={row.description} onChange={(e) => updateRow(row.id, { description: e.target.value })} className="w-full bg-transparent p-1 outline-none" placeholder="شرح هزینه" />
                      ) : (
                        <span className="block p-1">{row.description || "—"}</span>
                      )}
                    </td>
                    <td data-label="مبلغ" className="border p-1">
                      {isEditing ? (
                        <input inputMode="numeric" value={row.amount} onChange={(e) => updateRow(row.id, { amount: e.target.value })} className="w-full bg-transparent p-1 text-left outline-none" />
                      ) : (
                        <span className="block p-1 text-left">{money(Number(digits(row.amount).replace(/[,٬]/g, "") || 0))}</span>
                      )}
                    </td>
                    <td className="actions border p-1 text-center print:hidden">
                      {isEditing && (
                        <button onClick={() => removeRow(row.id)} className="font-bold text-red-600" aria-label="حذف ردیف">
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="total-row bg-slate-100 font-black">
                  <td colSpan={3} className="border p-3">جمع کل هزینه‌ها</td>
                  <td className="border p-3 text-left">{money(total)}</td>
                  <td className="border print:hidden" />
                </tr>
                <tr className="bg-emerald-50 font-black text-emerald-800">
                  <td colSpan={3} className="border border-emerald-200 p-3">مانده طلب تنخواه‌دار</td>
                  <td className="border border-emerald-200 p-3 text-left">{money(balance)}</td>
                  <td className="border border-emerald-200 print:hidden" />
                </tr>
              </tbody>
            </table>
          </div>

          <section className="mt-10 border-t border-dashed pt-5">
            <div className="mb-4">
              <h4 className="font-black">امضا و تأیید</h4>
              <p className="mt-1 text-xs text-slate-500">تنظیم‌کننده فعلاً تنها جایگاه دارای امضای دیجیتال با انگشت است.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Signature
                label="تنظیم‌کننده"
                value={signature}
                editing={isEditing}
                onChange={updateSignature}
                onClear={clearSignature}
              />
              <SignaturePlaceholder label="تأییدکننده (مدیر پروژه / سرپرست)" />
              <SignaturePlaceholder label="تصویب (مدیریت عامل / امور مالی)" />
            </div>
          </section>

          <p className="mt-8 text-center text-xs text-slate-500">
            این سند به‌صورت سیستمی توسط سامانه مالی شرکت صادر گردیده است.
          </p>
        </article>
      </div>

      <style jsx global>{`
        .label { display:block; margin-bottom:.35rem; font-size:.75rem; font-weight:700; color:#475569; }
        .input { width:100%; border-radius:.75rem; border:1px solid #e2e8f0; background:#fff; padding:.7rem .8rem; outline:none; }
        .input:focus { border-color:#0f766e; box-shadow:0 0 0 3px rgba(15,118,110,.1); }
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background:#fff !important; }
          .invoice-paper { min-height: 270mm; }
          input { border:0 !important; }
        }
      `}
      </style>
    </main>
  );
}

function SignaturePlaceholder({ label }: { label: string }) {
  return (
    <div className="text-center text-sm">
      <div className="font-bold">{label}</div>
      <div className="mt-3 h-[130px] border-b border-slate-400">
        <span className="text-xs text-slate-400">محل امضا</span>
      </div>
      <div className="mt-2 font-bold">نام و امضا: —</div>
      <div className="text-[10px] text-slate-400">در انتظار تأیید</div>
    </div>
  );
}

function Signature({
  label,
  value,
  editing,
  onChange,
  onClear,
}: {
  label: string;
  value: SignatureData;
  editing: boolean;
  onChange: (patch: Partial<SignatureData>) => void;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(280, canvas.clientWidth);
    const height = 130;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    if (value.image) {
      const image = new Image();
      image.onload = () => ctx.drawImage(image, 0, 0, width, height);
      image.src = value.image;
    }
  }, [editing]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const p = point(event);
    if (!ctx || !p) return;
    canvas?.setPointerCapture(event.pointerId);
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(event);
    if (!ctx || !p) return;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange({ image: canvas.toDataURL("image/png"), signedAt: new Date().toLocaleString("fa-IR") });
  };

  return (
    <div className="text-center text-sm">
      <div className="font-bold">{label}</div>
      {editing ? (
        <>
          <canvas ref={canvasRef} className="mt-3 h-[130px] w-full touch-none rounded-lg border border-dashed border-slate-300 bg-white" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} aria-label={"محل رسم امضای " + label} />
          <div className="mt-2 flex gap-2">
            <input value={value.name} onChange={(e) => onChange({ name: e.target.value })} className="input" placeholder="نام امضاکننده" />
            <button type="button" onClick={onClear} className="rounded-lg px-3 py-2 font-bold text-red-600 ring-1 ring-slate-200">پاک‌کردن</button>
          </div>
        </>
      ) : (
        <div className="mt-3 h-[130px] border-b border-slate-400">
          {value.image ? <img src={value.image} alt={"امضای " + label} className="mx-auto h-full max-w-full object-contain" /> : <span className="text-xs text-slate-400">بدون امضا</span>}
        </div>
      )}
      <div className="mt-2 font-bold">{value.name || "—"}</div>
      {value.signedAt && <div className="text-[10px] text-slate-400">ثبت امضا: {value.signedAt}</div>}
    </div>
  );
}


function statusLabel(status: InvoiceStatus) {
  return { draft: "پیش‌نویس", review: "در حال بررسی", final: "نهایی", paid: "پرداخت‌شده" }[status];
}

function Summary({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="text-xs font-bold text-slate-500">{label} (تومان)</div>
      <div className={`mt-1 text-xl font-black ${highlight ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

