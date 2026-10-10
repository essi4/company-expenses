"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { calculateMissionTotals, type MissionLocation, type MissionRow, type MissionStatus } from "../../lib/mission";
import { monthKeyFromJalaliDate } from "@/lib/month-key";

type SignatureData = { name: string; image: string; signedAt: string };
type SignatureMap = { preparer: SignatureData; approver: SignatureData; approval: SignatureData };

type Draft = {
  company: string;
  subtitle: string;
  documentNumber: string;
  issuedAt: string;
  status: MissionStatus;
  month: string;
  note: string;
  rows: MissionRow[];
  signatures: SignatureMap;
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
  company: "Alborz",
  subtitle: "مدیریت پروژه و عملیات",
  documentNumber: "OT-1405-05",
  issuedAt: "۱۴۰۵/۰۶/۰۳",
  status: "pending",
  month: "مرداد ۱۴۰۵",
  note: "",
  rows: initialRows,
  signatures: { preparer: { name: "", image: "", signedAt: "" }, approver: { name: "", image: "", signedAt: "" }, approval: { name: "", image: "", signedAt: "" } },
};

const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value);
const jalaliMonthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const normalizeDigits = (value: string) => value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
const toPersianDigits = (value: string) => value.replace(/\\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
const parseMonthSelection = (value: string, issuedAt: string) => {
  const normalized = normalizeDigits(value);
  const monthIndex = jalaliMonthNames.findIndex((name) => normalized.includes(name));
  const yearMatch = normalized.match(/13\\d{2}|14\\d{2}/);
  const dateMatch = normalizeDigits(issuedAt).match(/(13\\d{2}|14\\d{2})[/-](\\d{1,2})/);
  return {
    year: yearMatch?.[0] ?? dateMatch?.[1] ?? "1405",
    monthIndex: monthIndex >= 0 ? monthIndex : Math.min(11, Math.max(0, Number(dateMatch?.[2] ?? 7) - 1)),
  };
};
const emptyLocation = (): MissionLocation => ({ name: "", days: 0 });

export default function MissionReportPage() {
  const [company, setCompany] = useState(defaultDraft.company);
  const [subtitle, setSubtitle] = useState(defaultDraft.subtitle);
  const [documentNumber, setDocumentNumber] = useState(defaultDraft.documentNumber);
  const [issuedAt, setIssuedAt] = useState(defaultDraft.issuedAt);
  const [status, setStatus] = useState<MissionStatus>(defaultDraft.status);
  const [month, setMonth] = useState(defaultDraft.month);
  const [note, setNote] = useState(defaultDraft.note);
  const [rows, setRows] = useState<MissionRow[]>(defaultDraft.rows);
  const [signatures, setSignatures] = useState<SignatureMap>(defaultDraft.signatures);
  const [isEditing, setIsEditing] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<Draft>(defaultDraft);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const reportRef = useRef<HTMLElement>(null);
  const monthSelection = parseMonthSelection(month, issuedAt);
  const updateReportMonth = (year: string, monthIndex: number) => {
    setMonth(`${jalaliMonthNames[monthIndex]} ${toPersianDigits(year)}`);
    setIssuedAt(`${toPersianDigits(year)}/${toPersianDigits(String(monthIndex + 1).padStart(2, "0"))}/۰۱`);
  };

  useEffect(() => {
    const id = searchParams.get("id");
    const requestedMonth = searchParams.get("month");

    if (id) {
      (async () => {
        try {
          const response = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { cache: "no-store" });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.message || "دریافت گزارش مأموریت ناموفق بود");
          const doc = result.data;
          if (doc.type !== "mission") throw new Error("این سند گزارش مأموریت نیست.");
          const draft = JSON.parse(doc.payload_json) as Draft;
          setCompany(draft.company);
          setSubtitle(draft.subtitle);
          setDocumentNumber(draft.documentNumber || doc.document_number);
          setIssuedAt(draft.issuedAt || doc.issued_at);
          setStatus(draft.status || doc.status);
          setMonth(draft.month || "گزارش مأموریت");
          setNote(draft.note ?? "");
          setRows(Array.isArray(draft.rows) ? draft.rows : []);
          setSignatures(draft.signatures ?? defaultDraft.signatures);
          setSavedSnapshot({ ...draft, note: draft.note ?? "", signatures: draft.signatures ?? defaultDraft.signatures });
          setSavedDocumentId(id);
          setHasLocalDraft(false);
          setMessage("گزارش مأموریت از سوابق ماه باز شد.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "دریافت گزارش مأموریت ناموفق بود");
        }
      })();
      return;
    }

    if (requestedMonth) {
      const [year, monthNumber] = requestedMonth.split("-");
      const index = Number(monthNumber) - 1;
      const names = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
      if (/^14\d{2}$/.test(year) && index >= 0 && index < 12) {
        const label = `${names[index]} ${year.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}`;
        setMonth(label);
        setIssuedAt(`${year}/${String(Number(monthNumber)).padStart(2, "0")}/01`);
      }
      setHasLocalDraft(false);
      return;
    }

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
      setNote(draft.note ?? "");
      setRows(draft.rows);
      setSignatures(draft.signatures ?? defaultDraft.signatures);
      setSavedSnapshot({ ...draft, note: draft.note ?? "", signatures: draft.signatures ?? defaultDraft.signatures });
      setHasLocalDraft(true);
      setMessage("پیش‌نویس ذخیره‌شده محلی بازیابی شد.");
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, [searchParams]);

  const snapshot = (): Draft => ({ company, subtitle, documentNumber, issuedAt, status, month, note, rows, signatures });

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
    setNote(draft.note ?? "");
    setRows(draft.rows);
    setSignatures(draft.signatures);
    setIsEditing(false);
    setMessage("تغییرات ذخیره‌نشده لغو شد.");
  };

  const saveDraft = async () => {
    const draft = snapshot();
    const requestedMonth = searchParams.get("month");
    const monthKey = requestedMonth && /^14\\d{2}-\\d{2}$/.test(requestedMonth) ? requestedMonth : monthKeyFromJalaliDate(issuedAt);
    if (!monthKey) {
      setMessage("تاریخ تنظیم معتبر نیست؛ نمونه: ۱۴۰۵/۰۷/۱۰");
      return;
    }

    try {
      const response = await fetch(savedDocumentId ? `/api/documents?id=${encodeURIComponent(savedDocumentId)}` : "/api/documents", {
        method: savedDocumentId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "mission",
          document_number: documentNumber,
          issued_at: issuedAt,
          month_key: monthKey,
          status,
          title: subtitle,
          total_amount: 0,
          total_days: totals.totalDays,
          payload_json: draft,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "ذخیره مأموریت ناموفق بود");

      const savedId = result.data?.id || savedDocumentId;
      if (savedId) setSavedDocumentId(savedId);
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setSavedSnapshot(draft);
      setHasLocalDraft(true);
      setIsEditing(false);
      setMessage("گزارش مأموریت در D1 ذخیره شد.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ذخیره مأموریت ناموفق بود");
    }
  };

  const totals = useMemo(() => calculateMissionTotals(rows), [rows]);

  const updateRow = (id: number, patch: Partial<MissionRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updateLocation = (rowId: number, index: number, patch: Partial<MissionLocation>) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;
        const locations = row.locations.map((location, i) => (i === index ? { ...location, ...patch } : location));
        const days = locations.reduce((sum, location) => sum + Math.max(0, Math.trunc(Number(location.days) || 0)), 0);
        return { ...row, locations, days };
      }),
    );
  };

  const addLocation = (rowId: number) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, locations: [...row.locations, emptyLocation()] } : row)));
  };

  const removeLocation = (rowId: number, index: number) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;
        const locations = row.locations.filter((_, i) => i !== index);
        const days = locations.reduce((sum, location) => sum + Math.max(0, Math.trunc(Number(location.days) || 0)), 0);
        return { ...row, locations, days };
      }),
    );
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      { id: Math.max(0, ...current.map((row) => row.id)) + 1, personName: "", days: 0, locations: [emptyLocation()], activity: "", tag: "" },
    ]);
  };

  const removeRow = (id: number) => setRows((current) => current.filter((row) => row.id !== id));

  const updateSignature = (key: keyof SignatureMap, patch: Partial<SignatureData>) => {
    setSignatures((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  };

  const clearSignature = (key: keyof SignatureMap) => updateSignature(key, { image: "", signedAt: "" });

  const exportImage = async () => {
    if (!reportRef.current || isEditing) return;
    setExporting(true);
    document.body.classList.add("document-export");
    try {
      const dataUrl = await toPng(reportRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${documentNumber || "mission-report"}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      document.body.classList.remove("document-export");
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    if (!reportRef.current || isEditing) return;
    setExporting(true);
    document.body.classList.add("document-export");
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
      document.body.classList.remove("document-export");
      setExporting(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-5 print:max-w-none print:px-0 print:py-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <p className="text-xs font-bold text-slate-500">مدیریت عملیات Alborz</p>
            <h1 className="text-2xl font-black">گزارش مأموریت</h1>
            <p className="mt-1 text-xs text-slate-500">{hasLocalDraft ? "پیش‌نویس محلی موجود است" : "گزارش جدید"}{message ? ` · ${message}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => (window.location.href = "/")} className="rounded-xl bg-white px-4 py-2 font-bold ring-1 ring-slate-200">
              ← داشبورد
            </button>
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
            <div className="block">
              <span className="label">ماه کارکرد (شمسی)</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={String(monthSelection.monthIndex)}
                  onChange={(e) => updateReportMonth(monthSelection.year, Number(e.target.value))}
                  className="input"
                  aria-label="انتخاب ماه جلالی"
                >
                  {jalaliMonthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
                </select>
                <select
                  value={monthSelection.year}
                  onChange={(e) => updateReportMonth(e.target.value, monthSelection.monthIndex)}
                  className="input"
                  aria-label="انتخاب سال جلالی"
                >
                  {Array.from({ length: 26 }, (_, index) => String(1390 + index)).map((year) => (
                    <option key={year} value={year}>{toPersianDigits(year)}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="label">توضیحات / یادداشت</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input min-h-20 resize-y" placeholder="اگر لازم است توضیح یا مورد دیگری به گزارش مأموریت اضافه شود، اینجا بنویسید." />
            </label>
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

          {note.trim() && (
            <section className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-black text-slate-700">توضیحات / یادداشت</div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note}</p>
            </section>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm mission-table">
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
                    <td data-label="ردیف" className="border p-2 text-center">{(index + 1).toLocaleString("fa-IR")}</td>
                    <td data-label="نام و نام خانوادگی" className="border p-1 align-top">
                      {isEditing ? <input value={row.personName} onChange={(e) => updateRow(row.id, { personName: e.target.value })} className="input" placeholder="نام و نام خانوادگی" /> : <span className="block p-1">{row.personName || "—"}</span>}
                    </td>
                    <td data-label="مدت (روز)" className="border p-1 align-top">
                      {isEditing ? <input inputMode="numeric" type="number" min={0} value={row.days} readOnly className="input bg-slate-50 text-center" aria-label="جمع روزهای محل‌های مأموریت" /> : <span className="block p-1 text-center">{money(row.days)} روز</span>}
                    </td>
                    <td data-label="محل مأموریت(ها)" className="border p-1 align-top">
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
                    <td data-label="موضوع / شرح فعالیت" className="border p-1 align-top">
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
                    <td className="actions border p-1 text-center print:hidden">{isEditing && <button onClick={() => removeRow(row.id)} className="font-bold text-red-600" aria-label="حذف نفر">×</button>}</td>
                  </tr>
                ))}
                <tr className="mission-total-row bg-slate-100 font-black">
                  <td data-label="جمع" colSpan={2} className="border p-3">جمع کل کارکرد / مأموریت</td>
                  <td data-label="روز" className="border p-3 text-center">{money(totals.totalDays)} روز</td>
                  <td data-label="نفر-روز" colSpan={3} className="border p-3 text-center text-xs font-normal text-slate-600">مجموعاً {money(totals.totalPersonDays)} نفر-روز مأموریت ثبت شده است.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <section className="mt-10 border-t border-dashed pt-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h4 className="font-black">امضا و تأیید</h4>
                <p className="mt-1 text-xs text-slate-500">فقط امضای تنظیم‌کننده فعلاً به‌صورت دیجیتال و قابل رسم با انگشت ثبت می‌شود.</p>
              </div>
              {isEditing && <span className="text-xs font-bold text-amber-700">امضای تأییدکننده و تصویب در این مرحله به‌صورت جای امضا باقی می‌ماند.</span>}
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <SignaturePad label="تنظیم‌کننده" value={signatures.preparer} editing={isEditing} onChange={(patch) => updateSignature("preparer", patch)} onClear={() => clearSignature("preparer")} />
              <SignaturePlaceholder label="تأییدکننده (مدیر پروژه / سرپرست)" />
              <SignaturePlaceholder label="تصویب (مدیریت عامل / امور مالی)" />
            </div>
          </section>

          <p className="mt-8 text-center text-xs text-slate-500">این سند به‌صورت سیستمی توسط سامانه مالی شرکت صادر گردیده است.</p>
        </article>
      </div>

      <style jsx global>{`
        .label { display:block; margin-bottom:.35rem; font-size:.75rem; font-weight:700; color:#475569; }
        .input { width:100%; border-radius:.75rem; border:1px solid #e2e8f0; background:#fff; padding:.7rem .8rem; outline:none; }
        .input:focus { border-color:#0f766e; box-shadow:0 0 0 3px rgba(15,118,110,.1); }
        canvas { touch-action: none; }
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

function SignaturePad({
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
