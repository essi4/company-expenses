"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BusinessFinancePanel from "./business-finance-panel";

type Customer = { id: string; name: string; phone: string };
type Service = { id: string; name: string; price: number; duration: number };
type Staff = { id: string; name: string; role: string };
type Appointment = { id: string; date: string; time: string; startsAt: string; customer: string; service: string; staff: string; status: "رزرو" | "انجام شد" | "لغو شد" };
type Payment = { id: string; customer: string; service: string; amount: number; method: "نقدی" | "کارت" };

const initialCustomers: Customer[] = [
  { id: "demo-customer-1", name: "امیر رضایی", phone: "۰۹۱۲۱۲۳۴۵۶۷" },
  { id: "demo-customer-2", name: "محمد احمدی", phone: "۰۹۳۵۱۲۳۴۵۶۷" },
  { id: "demo-customer-3", name: "علی کریمی", phone: "۰۹۱۷۱۲۳۴۵۶۷" },
];

const initialServices: Service[] = [
  { id: "demo-service-1", name: "اصلاح مو", price: 280000, duration: 30 },
  { id: "demo-service-2", name: "اصلاح و ریش", price: 420000, duration: 45 },
  { id: "demo-service-3", name: "پاکسازی پوست", price: 650000, duration: 60 },
];

const initialStaff: Staff[] = [
  { id: "demo-staff-1", name: "اسماعیل", role: "آرایشگر ارشد" },
  { id: "demo-staff-2", name: "رضا", role: "آرایشگر" },
];

const initialAppointments: Appointment[] = [
  { id: "demo-appointment-1", date: dateKey(), time: "۱۷:۰۰", startsAt: `${dateKey()}T17:00:00`, customer: "امیر رضایی", service: "اصلاح مو", staff: "اسماعیل", status: "رزرو" },
  { id: "demo-appointment-2", date: dateKey(), time: "۱۸:۳۰", startsAt: `${dateKey()}T18:30:00`, customer: "محمد احمدی", service: "اصلاح و ریش", staff: "رضا", status: "رزرو" },
];

const initialPayments: Payment[] = [
  { id: "demo-payment-1", customer: "امیر رضایی", service: "اصلاح مو", amount: 280000, method: "کارت" },
  { id: "demo-payment-2", customer: "علی کریمی", service: "اصلاح و ریش", amount: 420000, method: "نقدی" },
];

const toman = new Intl.NumberFormat("fa-IR");
const dateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const dateTitle = (value: string) => new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`));

export default function BeautyWorkspace({ name, mode, plan, businessSlug }: { name: string; mode: string; plan: string; businessSlug?: string }) {
  const [tab, setTab] = useState("داشبورد");
  const [customers, setCustomers] = useState(initialCustomers);
  const [services, setServices] = useState(initialServices);
  const [staff, setStaff] = useState(initialStaff);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [calendarDate, setCalendarDate] = useState(dateKey());
  const [toast, setToast] = useState("");
  const supabase = useMemo(() => createClient(), []);
  const [resolvedBusinessId, setResolvedBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(businessSlug));

  const [customerForm, setCustomerForm] = useState({ name: "", phone: "" });
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", duration: "30" });
  const [staffForm, setStaffForm] = useState({ name: "", role: "" });
  const [appointmentForm, setAppointmentForm] = useState({ date: dateKey(), time: "۱۹:۰۰", customer: initialCustomers[0].name, service: initialServices[0].name, staff: initialStaff[0].name });
  const [paymentForm, setPaymentForm] = useState({ customer: initialCustomers[0].name, service: initialServices[0].name, amount: String(initialServices[0].price), method: "کارت" as Payment["method"] });
  const [settings, setSettings] = useState({ name, phone: "۰۷۱۳۲۲۲۲۲۲۲", address: "شیراز، خیابان نمونه", booking: true });

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function addCustomer() {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) return;
    if (!resolvedBusinessId) return;
    const { data, error } = await supabase.from("business_customers").insert({ business_id: resolvedBusinessId, name: customerForm.name.trim(), phone: customerForm.phone.trim() }).select("id,name,phone").single();
    if (error || !data) return notify("ثبت مشتری انجام نشد.");
    const next = { id: data.id, name: data.name, phone: data.phone };
    setCustomers((items) => [...items, next]);
    setCustomerForm({ name: "", phone: "" });
    notify("مشتری ثبت شد.");
  }

  async function addService() {
    const price = Number(serviceForm.price);
    const duration = Number(serviceForm.duration);
    if (!serviceForm.name.trim() || !price || !duration) return;
    if (!resolvedBusinessId) return;
    const { data, error } = await supabase.from("business_services").insert({ business_id: resolvedBusinessId, name: serviceForm.name.trim(), price, duration_minutes: duration }).select("id,name,price,duration_minutes").single();
    if (error || !data) return notify("ثبت خدمت انجام نشد.");
    const next = { id: data.id, name: data.name, price: Number(data.price), duration: data.duration_minutes };
    setServices((items) => [...items, next]);
    setServiceForm({ name: "", price: "", duration: "30" });
    notify("خدمت ثبت شد.");
  }

  async function addStaff() {
    if (!staffForm.name.trim() || !staffForm.role.trim()) return;
    if (!resolvedBusinessId) return;
    const { data, error } = await supabase.from("business_staff").insert({ business_id: resolvedBusinessId, name: staffForm.name.trim(), role: staffForm.role.trim() }).select("id,name,role").single();
    if (error || !data) return notify("ثبت کارکن انجام نشد.");
    const next = { id: data.id, name: data.name, role: data.role };
    setStaff((items) => [...items, next]);
    setStaffForm({ name: "", role: "" });
    notify("کارکن ثبت شد.");
  }

  async function addAppointment() {
    if (!appointmentForm.customer || !appointmentForm.service || !appointmentForm.staff || !appointmentForm.time) return;
    if (!resolvedBusinessId) return;
    const customer = customers.find((x) => x.name === appointmentForm.customer); const service = services.find((x) => x.name === appointmentForm.service); const worker = staff.find((x) => x.name === appointmentForm.staff);
    if (!customer || !service || !worker) return notify("اطلاعات نوبت ناقص است.");
    const today = new Date(`${appointmentForm.date}T12:00:00`); const [hh, mm] = appointmentForm.time.split(":").map(Number); if (Number.isFinite(hh) && Number.isFinite(mm)) today.setHours(hh, mm, 0, 0);
    const { data, error } = await supabase.from("business_appointments").insert({ business_id: resolvedBusinessId, customer_id: customer.id, service_id: service.id, staff_id: worker.id, starts_at: today.toISOString(), status: "reserved" }).select("id,starts_at,status").single();
    if (error || !data) return notify("ثبت نوبت انجام نشد.");
    const next = { id: data.id, date: dateKey(new Date(data.starts_at)), time: new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(data.starts_at)), startsAt: data.starts_at, customer: customer.name, service: service.name, staff: worker.name, status: "رزرو" as const };
    setAppointments((items) => [...items, next]);
    notify("نوبت ثبت شد.");
  }

  async function updateAppointment(id: string, status: Appointment["status"]) {
    if (!resolvedBusinessId) return;
    const dbStatus = status === "انجام شد" ? "completed" : "cancelled";
    const { error } = await supabase.from("business_appointments").update({ status: dbStatus }).eq("id", id).eq("business_id", resolvedBusinessId);
    if (error) return notify("تغییر وضعیت نوبت انجام نشد.");
    setAppointments((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    notify(status === "انجام شد" ? "نوبت تکمیل شد." : "نوبت لغو شد.");
  }

  async function saveSettings() {
    if (!resolvedBusinessId) return;
    const { error } = await supabase.from("businesses").update({
      name: settings.name.trim(), phone: settings.phone.trim(), address: settings.address.trim(), online_booking: settings.booking, updated_at: new Date().toISOString(),
    }).eq("id", resolvedBusinessId);
    if (error) return notify("ذخیره تنظیمات انجام نشد.");
    notify("تنظیمات ذخیره شد.");
  }

  async function addPayment() {
    const amount = Number(paymentForm.amount);
    if (!paymentForm.customer || !paymentForm.service || !amount) return;
    if (!resolvedBusinessId) return;
    const customer = customers.find((x) => x.name === paymentForm.customer); const service = services.find((x) => x.name === paymentForm.service); if (!customer || !service) return notify("اطلاعات پرداخت ناقص است.");
    const { data, error } = await supabase.from("business_payments").insert({ business_id: resolvedBusinessId, customer_id: customer.id, service_id: service.id, amount, method: paymentForm.method === "کارت" ? "card" : "cash" }).select("id,amount,method").single();
    if (error || !data) return notify("ثبت پرداخت انجام نشد.");
    const next = { id: data.id, customer: customer.name, service: service.name, amount: Number(data.amount), method: data.method === "card" ? "کارت" as const : "نقدی" as const };
    setPayments((items) => [...items, next]);
    notify("پرداخت ثبت شد.");
  }

  useEffect(() => {
    let alive = true;
    async function loadWorkspace() {
      if (!businessSlug) { setLoading(false); return; }
      setLoading(true);
      const { data: business } = await supabase.from("businesses").select("id,name,phone,address,online_booking").eq("slug", businessSlug).maybeSingle();
      if (!business) { setLoading(false); return; }
      const [customerResult, serviceResult, staffResult, appointmentResult, paymentResult] = await Promise.all([
        supabase.from("business_customers").select("id,name,phone").eq("business_id", business.id).order("created_at", { ascending: true }),
        supabase.from("business_services").select("id,name,price,duration_minutes").eq("business_id", business.id).eq("active", true).order("created_at", { ascending: true }),
        supabase.from("business_staff").select("id,name,role").eq("business_id", business.id).eq("active", true).order("created_at", { ascending: true }),
        supabase.from("business_appointments").select("id,starts_at,status,business_customers(name),business_services(name),business_staff(name)").eq("business_id", business.id).order("starts_at", { ascending: true }),
        supabase.from("business_payments").select("id,amount,method,paid_at,business_customers(name),business_services(name)").eq("business_id", business.id).order("paid_at", { ascending: false }).limit(50),
      ]);
      if (!alive) return;
      setResolvedBusinessId(business.id);
      if (customerResult.data) setCustomers(customerResult.data);
      if (serviceResult.data) setServices(serviceResult.data.map((x) => ({ id: x.id, name: x.name, price: Number(x.price), duration: x.duration_minutes })));
      if (staffResult.data) setStaff(staffResult.data);
      if (appointmentResult.data) setAppointments(appointmentResult.data.map((x: any) => ({
        id: x.id,
        date: dateKey(new Date(x.starts_at)),
        time: new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(x.starts_at)),
        startsAt: x.starts_at,
        customer: x.business_customers?.name ?? "مشتری",
        service: x.business_services?.name ?? "خدمت",
        staff: x.business_staff?.name ?? "کارکن",
        status: x.status === "completed" ? "انجام شد" : x.status === "cancelled" ? "لغو شد" : "رزرو",
      })));
      if (paymentResult.data) setPayments(paymentResult.data.map((x: any) => ({
        id: x.id, customer: x.business_customers?.name ?? "مشتری", service: x.business_services?.name ?? "خدمت", amount: Number(x.amount),
        method: x.method === "card" ? "کارت" : "نقدی",
      })));
      setSettings({ name: business.name ?? name, phone: business.phone ?? "", address: business.address ?? "", booking: Boolean(business.online_booking) });
      setLoading(false);
    }
    loadWorkspace();
    return () => { alive = false; };
  }, [businessSlug, name, supabase]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((item) => !q || item.name.toLowerCase().includes(q) || item.phone.includes(q));
  }, [customers, search]);

  const todaySales = payments.reduce((sum, item) => sum + item.amount, 0);
  const activeAppointments = appointments.filter((item) => item.status === "رزرو").length;

  const nav = ["داشبورد", "نوبت‌ها", "مشتریان", "خدمات", "کارکنان", "فروش و پرداخت", "گزارش‌ها", "تنظیمات"];

  return (
    <div dir="rtl" className="relative min-h-full bg-slate-950 text-white">\n      {loading && <div className="border-b border-cyan-400/10 bg-cyan-400/5 px-5 py-2 text-center text-xs font-bold text-cyan-200">در حال بارگذاری اطلاعات واقعی آرایشگاه…</div>}
      {toast && <div className="fixed bottom-5 right-5 z-[90] rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200 shadow-xl">{toast}</div>}
      <div className="border-b border-white/10 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-black text-cyan-300">فضای کاری فعال</span>
            <h2 className="mt-2 text-2xl font-black">{settings.name}</h2>
            <p className="mt-1 text-sm text-slate-400">آرایشگاه · {mode} · {plan}</p>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black text-emerald-300">● فعال</span>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.03] p-3">
          <div className="rounded-2xl bg-white p-4 text-slate-950">
            <b className="block text-base">{settings.name}</b>
            <span className="mt-1 block text-[11px] text-slate-500">آرایشگاه {mode}</span>
          </div>
          <nav className="mt-4 space-y-1.5">
            {nav.map((item) => <button key={item} type="button" onClick={() => { setTab(item); setSearch(""); }} className={`w-full rounded-2xl px-4 py-3 text-right text-xs font-bold transition ${tab === item ? "bg-cyan-400/10 text-cyan-200" : "text-slate-400 hover:bg-white/[0.04]"}`}>{item}</button>)}
          </nav>
        </aside>

        <section className="min-w-0 space-y-5">
          {tab === "داشبورد" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[[String(activeAppointments), "نوبت‌های فعال"], [String(customers.length), "مشتریان"], [String(services.length), "خدمات"], [toman.format(todaySales), "فروش امروز (ریال)"]].map(([value, label]) => <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><span className="text-[10px] text-slate-500">{label}</span><b className="mt-2 block text-2xl font-black">{value}</b></div>)}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <h3 className="font-black">نوبت‌های امروز</h3>
                  <div className="mt-4 space-y-2">{appointments.slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-xs"><span>{item.time} · {item.customer}</span><span className="text-slate-500">{item.service}</span></div>)}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <h3 className="font-black">فروش اخیر</h3>
                  <div className="mt-4 space-y-2">{payments.slice(-5).reverse().map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-xs"><span>{item.customer}</span><b>{toman.format(item.amount)} ریال</b></div>)}</div>
                </div>
              </div>
            </>
          )}

          {tab === "نوبت‌ها" && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><span className="text-[10px] font-black text-cyan-300">تقویم نوبت‌ها</span><h3 className="mt-1 font-black">{dateTitle(calendarDate)}</h3></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCalendarDate(dateKey(new Date(new Date(`${calendarDate}T12:00:00`).getTime() - 86400000)))} className="rounded-xl border border-white/10 px-3 py-2 text-xs">روز قبل</button>
                    <button type="button" onClick={() => setCalendarDate(dateKey())} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">امروز</button>
                    <button type="button" onClick={() => setCalendarDate(dateKey(new Date(new Date(`${calendarDate}T12:00:00`).getTime() + 86400000)))} className="rounded-xl border border-white/10 px-3 py-2 text-xs">روز بعد</button>
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  {Array.from({ length: 13 }, (_, index) => 9 + index).map((hour) => {
                    const hourAppointments = appointments.filter((item) => item.date === calendarDate && Number(item.time.replace(/[^d]/g, "").slice(0, 2)) === hour);
                    return <div key={hour} className="grid min-h-16 grid-cols-[68px_1fr] gap-3 border-t border-white/5 pt-2">
                      <span className="pt-2 text-xs font-bold text-slate-500">{toman.format(hour)}:۰۰</span>
                      <div className="space-y-2">
                        {hourAppointments.length === 0 ? <div className="h-10 rounded-xl border border-dashed border-white/5" /> : hourAppointments.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2 text-xs"><span><b>{item.customer}</b> · {item.service} · {item.staff}</span><span className="text-slate-400">{item.time} · {item.status}</span></div>)}
                      </div>
                    </div>;
                  })}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <h3 className="font-black">رزرو نوبت جدید</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-5">
                  <input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
                  <input value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} placeholder="ساعت" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
                  <select value={appointmentForm.customer} onChange={(e) => setAppointmentForm({ ...appointmentForm, customer: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{customers.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                  <select value={appointmentForm.service} onChange={(e) => setAppointmentForm({ ...appointmentForm, service: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{services.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                  <select value={appointmentForm.staff} onChange={(e) => setAppointmentForm({ ...appointmentForm, staff: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{staff.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                </div>
                <button type="button" onClick={addAppointment} className="mt-3 rounded-2xl bg-white px-5 py-3 text-xs font-black text-slate-950">ثبت نوبت</button>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between"><h3 className="font-black">همه نوبت‌ها</h3><span className="text-[10px] text-slate-500">{appointments.length} نوبت</span></div>
                <div className="mt-4 space-y-2">{appointments.map((item) => <div key={item.id} className="grid gap-2 rounded-2xl border border-white/10 p-4 sm:grid-cols-[100px_100px_1fr_auto] sm:items-center"><b className="text-sm">{item.date}</b><b className="text-sm">{item.time}</b><span className="text-xs text-slate-400">{item.customer} · {item.service} · {item.staff}</span><div className="flex gap-2">{item.status === "رزرو" && <><button type="button" onClick={() => updateAppointment(item.id, "انجام شد")} className="rounded-xl bg-emerald-400 px-3 py-2 text-[10px] font-black text-slate-950">تکمیل</button><button type="button" onClick={() => updateAppointment(item.id, "لغو شد")} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-bold">لغو</button></>}<span className="rounded-xl border border-white/10 px-3 py-2 text-[10px] text-slate-400">{item.status}</span></div></div>)}</div>
              </div>
            </div>
          )}

          {tab === "مشتریان" && (
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="نام مشتری" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
                <input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="شماره موبایل" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
                <button type="button" onClick={addCustomer} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">ثبت مشتری</button>
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جست‌وجوی مشتری..." className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
              <div className="space-y-2">{filteredCustomers.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div><b className="text-sm">{item.name}</b><span className="mr-3 text-xs text-slate-500">{item.phone}</span></div><span className="text-[10px] text-emerald-300">فعال</span></div>)}</div>
            </div>
          )}

          {tab === "خدمات" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} placeholder="نام خدمت" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none sm:col-span-2" />
                <input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} placeholder="قیمت ریال" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
                <input type="number" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} placeholder="دقیقه" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
              </div>
              <button type="button" onClick={addService} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">افزودن خدمت</button>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{services.map((item) => <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><b className="block text-base">{item.name}</b><span className="mt-2 block text-xs text-slate-400">{item.duration} دقیقه</span><strong className="mt-3 block">{toman.format(item.price)} ریال</strong></div>)}</div>
            </div>
          )}

          {tab === "کارکنان" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="نام کارکن" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
                <input value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} placeholder="سمت" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
                <button type="button" onClick={addStaff} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">ثبت کارکن</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">{staff.map((item) => <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><b className="block">{item.name}</b><span className="mt-2 block text-xs text-slate-400">{item.role}</span></div>)}</div>
            </div>
          )}

          {tab === "فروش و پرداخت" && (
            <BusinessFinancePanel
              businessId={resolvedBusinessId ?? ""}
              customers={customers}
              services={services}
            />
          )}

          {tab === "گزارش‌ها" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[[String(customers.length), "کل مشتریان"], [String(appointments.length), "کل نوبت‌ها"], [String(appointments.filter((a) => a.status === "انجام شد").length), "نوبت تکمیل‌شده"], [toman.format(todaySales), "کل فروش (ریال)"]].map(([value, label]) => <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><span className="text-xs text-slate-500">{label}</span><b className="mt-2 block text-2xl font-black">{value}</b></div>)}
            </div>
          )}

          {tab === "تنظیمات" && (
            <div className="max-w-2xl space-y-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <h3 className="font-black">تنظیمات آرایشگاه</h3>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-400">نام کسب‌وکار</span><input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-400">تلفن</span><input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-400">آدرس</span><input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" /></label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 p-4 text-sm"><input type="checkbox" checked={settings.booking} onChange={(e) => setSettings({ ...settings, booking: e.target.checked })} /> دریافت آنلاین نوبت فعال باشد</label>
              <button type="button" onClick={saveSettings} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">ذخیره تنظیمات</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
