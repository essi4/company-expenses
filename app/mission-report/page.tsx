"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { calculateMissionTotals, type MissionLocation, type MissionRow, type MissionStatus } from "../../lib/mission";

type Draft = {
  company: string;
  subtitle: string;
  documentNumber: string;
  issuedAt: string;
  status: MissionStatus;
  month: string;
  rows: MissionRow[];
};

const DRAFT_KEY = "company-expenses:mission-report:draft:v1";

const initialRows: MissionRow[] = [
  {
    id: 1,
    personName: "یعقوب شکری",
    days: 3,
    locations: [{ name: "تل بارگاه", days: 2 }, { name: "دارنگانه", days: 1 }],
    activity: "کابل‌کشی و عیب‌یابی فیبر نوری",
    tag: "شبکه / فیبر",
  },
  {
    id: 2,
    personName: "قاسم هنرور",
    days: 2,
    locations: [{ name: "تل بارگاه", days: 1 }, { name: "دارنگانه", days: 1 }],
    activity: "کابل‌کشی و عیب‌یابی فیبر نوری",
    tag: "شبکه / فیبر",
  },
  {
    id: 3,
    personName: "مجید کارجو",
    days: 1,
    locations: [{ name: "لایزنگان", days: 1 }],
    activity: "کابل‌کشی و عیب‌یابی فیبر نوری",
    tag: "شبکه / فیبر",
  },
];

const defaultDraft: Draft = {
  company: "شرکت عرضه ساره لب رود",
  subtitle: "مدیریت پروژه و عملیات",
  documentNumber: "OT-1405-05",
  issuedAt: "۱۴۰۵/۰۶/۰۳",
  status: "pending",
  month: "مرداد ۱۴۰۵",
  rows: initialRows,
};

const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value);
const emptyLocation = (): MissionLocation => ({ name: "", days: 0 });

export default function MissionReportPage() {
  const [company, setCompany] = useState(defaultDraft.company);
  const [subtitle, setSubtitle] = useState(defaultDraft.subtitle);
  const [documentNumber, setDocumentNumber] = useState(defaultDraft.documentNumber);
  const [issuedAt, setIssuedAt] = useState(defaultDraft.issuedAt);
  const [status, setStatus] = useState<MissionStatus>(defaultDraft.status);
  const [month, setMonth] = useState(defaultDraft.month);
  const [rows, setRows] = useState<MissionRow[]>(defaultDraft.rows);
  const [isEditing, setIsEditing] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<Draft>(defaultDraft);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      if (!draft || !Array.isArray(draft.rows)) return;
      setCompany(draft.company);
      setSubtitle(draft.subtitle);
      setDocumentNumber(draft.documentNumber);
      setIssuedAt(draft.issuedAt);
      setStatus(draft.status);
      setMonth(draft.month);
      setRows(draft.rows);
      setSavedSnapshot(draft);
      setHasLocalDraft(true);
      setMessage("پیش‌نویس ذخیره‌شده محلی بازیابی شد.");
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const snapshot = (): Draft => ({ company, subtitle, documentNumber, issuedAt, status, month, rows });

  const startEditing = () => {
    setSavedSnapshot(snapshot());
    setIsEditing(true);
    setMessage("");
  };

  const cancelEditing = () => {
    const draft = savedSnapshot;
    setCompany(draft.company);
    setSubtitle(draft.subtitle);
    setDocumentNumber(draft.documentNumber);
    setIssuedAt(draft.issuedAt);
    setStatus(draft.status);
    setMonth(draft.month);
    setRows(draft.rows);
    setIsEditing(false);
    setMessage("تغییرات ذخیره‌نشده لغو شد.");
  };

  const saveDraft = () => {
    const draft = snapshot();
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setSavedSnapshot(draft);
    setHasLocalDraft(true);
    setIsEditing(false);
    setMessage("گزارش مأموریت در این دستگاه ذخیره شد.");
  };

  const totals = useMemo(() => calculateMissionTotals(rows), [rows]);

  const updateRow = (id: number, patch: Partial<MissionRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updateLocation = (rowId: number, index: number, patch: Partial<MissionLocation>) => {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? { ...row, locations: row.locations.map((location, i) => (i === index ? { ...location, ...patch } : location)) }
          : row,
      ),
    );
  };

  const addLocation = (rowId: number) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, locations: [...row.locations, emptyLocation()] } : row)));
  };

  const removeLocation = (rowId: number, index: number) => {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, locations: row.locations.filter((_, i) => i !== index) } : row)),
    );
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      { id: Math.max(0, ...current.map((row) => row.id)) + 1, personName: "", days: 0, locations: [emptyLocation()], activity: "", tag: "" },
    ]);
  };

  const removeRow = (id: number) => setRows((current) => current.filter((row) => row.id !== id));

  const exportImage = async () => {
    if (!reportRef.current || isEditing) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(reportRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${documentNumber || "mission-report"}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    if (!reportRef.current || isEditing) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(reportRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const imageWidth = pageWidth - margin * 2;
      const imageHeight = (reportRef.current.scrollHeight / reportRef.current.scrollWidth) * imageWidth;
      const usableHeight = pageHeight - margin * 2;
      let offset = 0;
      while (offset < imageHeight) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", margin, margin - offset, imageWidth, imageHeight, undefined, "FAST");
        offset += usableHeight;
      }
      pdf.save(`${documentNumber || "mission-report"}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-5 print:max-w-none print:px-0 print:py-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <p className="text-xs font-bold text-slate-500">مدیریت عملیات شرکت</p>
            <h1 className="text-2xl font-black">گزارش مأموریت</h1>
            <p className="mt-1 text-xs text-slate-500">{hasLocalDraft ? "پیش‌نویس محلی موجود است" : "گزارش جدید"}{message ? ` · ${message}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <button onClick={startEditing} className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-white">✏️ ویرایش گزارش</button>
            ) : (
              <>
                <button onClick={saveDraft} className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white">💾 ذخیره موقت</button>
                <button onClick={cancelEditing} className="rounded-xl bg-white px-4 py-2 font-bold ring-1 ring-slate-200">↩ لغو ویرایش</button>
                <button onClick={addRow} className="rounded-xl bg-white px-4 py-2 font-bold ring-1 ring-slate-200">＋ نفر</button>
              </>
            )}
            <button onClick={exportPdf} disabled={exporting || isEditing} className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-40">📄 PDF</button>
            <button onClick={exportImage} disabled={exporting || isEditing} className="rounded-xl bg-sky-700 px-4 py-2 font-bold text-white disabled:opacity-40">🖼 تصویر</button>
            <button onClick={() => window.print()} disabled={isEditing} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-40">🖨 چاپ / ذخیره PDF</button>
          </div>
        </div>

        {isEditing && (
          <section className="mb-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 print:hidden sm:grid-cols-2 lg:grid-cols-4">
            <Field label="نام شرکت" value={company} onChange={setCompany} />
            <Field label="زیرعنوان" value={subtitle} onChange={setSubtitle} />
            <Field label="شماره سند" value={documentNumber} onChange={setDocumentNumber} />
            <Field label="تاریخ تنظیم" value={issuedAt} onChange={setIssuedAt} />
            <Field label="ماه کارکرد" value={month} onChange={setMonth} />
            <label className="block">
              <span className="label">وضعیت</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as MissionStatus)} className="input">
                <option value="pending">در انتظار تایید</option>
                <option value="approved">تأیید شده</option>
                <option value="rejected">رد شده</option>
              </select>
            </label>
          </section>
        )}

        <article ref={reportRef} className="mission-paper bg-white p-5 shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0 sm:p-8">
          <header className="flex flex-col gap-4 border-b-2 border-slate-900 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">{company}</h2>
              <p className="mt-1 text-sm font-bold text-slate-600">{subtitle}</p>
            </div>
            <div className="text-sm leading-7 text-slate-600 sm:text-left">
              <div>تاریخ تنظیم: <b className="text-slate-900">{issuedAt}</b></div>
              <div>شماره سند: <b className="text-slate-900">{documentNumber}</b></div>
              <div>وضعیت: <b className="text-slate-900">{statusLabel(status)}</b></div>
            </div>
          </header>

          <div className="my-5 text-center">
            <h3 className="text-xl font-black">فرم گزارش اضافه‌کاری و مأموریت</h3>
            <p className="mt-1 text-sm text-slate-500">لیست کارکرد پرسنل — {month}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border p-2">ردیف</th>
                  <th className="border p-2">نام و نام خانوادگی</th>
                  <th className="border p-2">مدت (روز)</th>
                  <th className="border p-2">محل مأموریت(ها)</th>
                  <th className="border p-2 text-right">موضوع / شرح فعالیت</th>
                  <th className="w-10 border p-2 print:hidden" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border p-2 text-center">{(index + 1).toLocaleString("fa-IR")}</td>
                    <td className="border p-1 align-top">
                      {isEditing ? <input value={row.personName} onChange={(e) => updateRow(row.id, { personName: e.target.value })} className="input" placeholder="نام و نام خانوادگی" /> : <span className="block p-1">{row.personName || "—"}</span>}
                    </td>
                    <td className="border p-1 align-top">
                      {isEditing ? <input inputMode="numeric" type="number" min={0} value={row.days} onChange={(e) => updateRow(row.id, { days: Math.max(0, Number(e.target.value) || 0) })} className="input text-center" /> : <span className="block p-1 text-center">{money(row.days)} روز</span>}
                    </td>
                    <td className="border p-1 align-top">
                      <div className="space-y-2">
                        {row.locations.map((location, locationIndex) => (
                          <div key={`${row.id}-${locationIndex}`} className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <input value={location.name} onChange={(e) => updateLocation(row.id, locationIndex, { name: e.target.value })} className="input min-w-0" placeholder="محل" />
                                <input inputMode="numeric" type="number" min={0} value={location.days} onChange={(e) => updateLocation(row.id, locationIndex, { days: Math.max(0, Number(e.target.value) || 0) })} className="input w-20 text-center" />
                                <button onClick={() => removeLocation(row.id, locationIndex)} className="font-bold text-red-600" aria-label="حذف محل">×</button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-600">• {location.name || "بدون محل"} ({money(location.days)} روز)</span>
                            )}
                          </div>
                        ))}
                        {isEditing && <button onClick={() => addLocation(row.id)} className="text-xs font-bold text-sky-700">＋ افزودن محل</button>}
                      </div>
                    </td>
                    <td className="border p-1 align-top">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input value={row.tag || ""} onChange={(e) => updateRow(row.id, { tag: e.target.value })} className="input" placeholder="برچسب، مثلاً شبکه / فیبر" />
                          <textarea value={row.activity} onChange={(e) => updateRow(row.id, { activity: e.target.value })} className="input min-h-20" placeholder="شرح فعالیت" />
                        </div>
                      ) : (
                        <div>
                          {row.tag && <span className="inline-block rounded-md bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">{row.tag}</span>}
                          <div className="mt-1">{row.activity || "—"}</div>
                        </div>
                      )}
                    </td>
                    <td className="border p-1 text-center print:hidden">{isEditing && <button onClick={() => removeRow(row.id)} className="font-bold text-red-600" aria-label="حذف نفر">×</button>}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-black">
                  <td colSpan={2} className="border p-3">جمع کل کارکرد / مأموریت</td>
                  <td className="border p-3 text-center">{money(totals.totalDays)} روز</td>
                  <td colSpan={3} className="border p-3 text-center text-xs font-normal text-slate-600">مجموعاً {money(totals.totalPersonDays)} نفر-روز مأموریت ثبت شده است.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-10 grid gap-8 border-t border-dashed pt-5 sm:grid-cols-3">
            <Signature label="تنظیم‌کننده" />
            <Signature label="تأییدکننده (مدیر پروژه / سرپرست)" />
            <Signature label="تصویب (مدیریت عامل / امور مالی)" />
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">این سند به‌صورت سیستمی توسط سامانه مالی شرکت صادر گردیده است.</p>
        </article>
      </div>

      <style jsx global>{`
        .label { display:block; margin-bottom:.35rem; font-size:.75rem; font-weight:700; color:#475569; }
        .input { width:100%; border-radius:.75rem; border:1px solid #e2e8f0; background:#fff; padding:.7rem .8rem; outline:none; }
        .input:focus { border-color:#0f766e; box-shadow:0 0 0 3px rgba(15,118,110,.1); }
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background:#fff !important; }
          .mission-paper { min-height: 270mm; }
          input, textarea, select { border:0 !important; }
        }
      `}
      </style>
    </main>
  );
}

function statusLabel(status: MissionStatus) {
  return { pending: "در انتظار تایید", approved: "تأیید شده", rejected: "رد شده" }[status];
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </label>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="text-center text-sm font-bold">
      <div>{label}</div>
      <div className="mx-auto mt-12 w-4/5 border-t border-slate-400" />
    </div>
  );
}
