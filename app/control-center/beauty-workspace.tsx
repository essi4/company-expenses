"use client";

import { useMemo, useState } from "react";

type Customer = { id: number; name: string; phone: string };
type Service = { id: number; name: string; price: number; duration: number };
type Staff = { id: number; name: string; role: string };
type Appointment = { id: number; time: string; customer: string; service: string; staff: string; status: "رزرو" | "انجام شد" | "لغو شد" };
type Payment = { id: number; customer: string; service: string; amount: number; method: "نقدی" | "کارت" };

const initialCustomers: Customer[] = [
  { id: 1, name: "امیر رضایی", phone: "۰۹۱۲۱۲۳۴۵۶۷" },
  { id: 2, name: "محمد احمدی", phone: "۰۹۳۵۱۲۳۴۵۶۷" },
  { id: 3, name: "علی کریمی", phone: "۰۹۱۷۱۲۳۴۵۶۷" },
];

const initialServices: Service[] = [
  { id: 1, name: "اصلاح مو", price: 280000, duration: 30 },
  { id: 2, name: "اصلاح و ریش", price: 420000, duration: 45 },
  { id: 3, name: "پاکسازی پوست", price: 650000, duration: 60 },
];

const initialStaff: Staff[] = [
  { id: 1, name: "اسماعیل", role: "آرایشگر ارشد" },
  { id: 2, name: "رضا", role: "آرایشگر" },
];

const initialAppointments: Appointment[] = [
  { id: 1, time: "۱۷:۰۰", customer: "امیر رضایی", service: "اصلاح مو", staff: "اسماعیل", status: "رزرو" },
  { id: 2, time: "۱۸:۳۰", customer: "محمد احمدی", service: "اصلاح و ریش", staff: "رضا", status: "رزرو" },
];

const initialPayments: Payment[] = [
  { id: 1, customer: "امیر رضایی", service: "اصلاح مو", amount: 280000, method: "کارت" },
  { id: 2, customer: "علی کریمی", service: "اصلاح و ریش", amount: 420000, method: "نقدی" },
];

const toman = new Intl.NumberFormat("fa-IR");

export default function BeautyWorkspace({ name, mode, plan }: { name: string; mode: string; plan: string }) {
  const [tab, setTab] = useState("داشبورد");
  const [customers, setCustomers] = useState(initialCustomers);
  const [services, setServices] = useState(initialServices);
  const [staff, setStaff] = useState(initialStaff);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [customerForm, setCustomerForm] = useState({ name: "", phone: "" });
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", duration: "30" });
  const [staffForm, setStaffForm] = useState({ name: "", role: "" });
  const [appointmentForm, setAppointmentForm] = useState({ time: "۱۹:۰۰", customer: initialCustomers[0].name, service: initialServices[0].name, staff: initialStaff[0].name });
  const [paymentForm, setPaymentForm] = useState({ customer: initialCustomers[0].name, service: initialServices[0].name, amount: String(initialServices[0].price), method: "کارت" as Payment["method"] });
  const [settings, setSettings] = useState({ name, phone: "۰۷۱۳۲۲۲۲۲۲۲", address: "شیراز، خیابان نمونه", booking: true });

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function addCustomer() {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) return;
    setCustomers((items) => [...items, { id: Date.now(), name: customerForm.name.trim(), phone: customerForm.phone.trim() }]);
    setCustomerForm({ name: "", phone: "" });
    notify("مشتری ثبت شد.");
  }

  function addService() {
    const price = Number(serviceForm.price);
    const duration = Number(serviceForm.duration);
    if (!serviceForm.name.trim() || !price || !duration) return;
    setServices((items) => [...items, { id: Date.now(), name: serviceForm.name.trim(), price, duration }]);
    setServiceForm({ name: "", price: "", duration: "30" });
    notify("خدمت ثبت شد.");
  }

  function addStaff() {
    if (!staffForm.name.trim() || !staffForm.role.trim()) return;
    setStaff((items) => [...items, { id: Date.now(), name: staffForm.name.trim(), role: staffForm.role.trim() }]);
    setStaffForm({ name: "", role: "" });
    notify("کارکن ثبت شد.");
  }

  function addAppointment() {
    if (!appointmentForm.customer || !appointmentForm.service || !appointmentForm.staff || !appointmentForm.time) return;
    setAppointments((items) => [...items, { id: Date.now(), time: appointmentForm.time, ...appointmentForm, status: "رزرو" }]);
    notify("نوبت ثبت شد.");
  }

  function updateAppointment(id: number, status: Appointment["status"]) {
    setAppointments((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    notify(status === "انجام شد" ? "نوبت تکمیل شد." : "نوبت لغو شد.");
  }

  function addPayment() {
    const amount = Number(paymentForm.amount);
    if (!paymentForm.customer || !paymentForm.service || !amount) return;
    setPayments((items) => [...items, { id: Date.now(), customer: paymentForm.customer, service: paymentForm.service, amount, method: paymentForm.method }]);
    notify("پرداخت ثبت شد.");
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((item) => !q || item.name.toLowerCase().includes(q) || item.phone.includes(q));
  }, [customers, search]);

  const todaySales = payments.reduce((sum, item) => sum + item.amount, 0);
  const activeAppointments = appointments.filter((item) => item.status === "رزرو").length;

  const nav = ["داشبورد", "نوبت‌ها", "مشتریان", "خدمات", "کارکنان", "فروش و پرداخت", "گزارش‌ها", "تنظیمات"];

  return (
    <div dir="rtl" className="relative min-h-full bg-slate-950 text-white">
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
                <h3 className="font-black">رزرو نوبت جدید</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <input value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} placeholder="ساعت" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
                  <select value={appointmentForm.customer} onChange={(e) => setAppointmentForm({ ...appointmentForm, customer: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{customers.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                  <select value={appointmentForm.service} onChange={(e) => setAppointmentForm({ ...appointmentForm, service: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{services.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                  <select value={appointmentForm.staff} onChange={(e) => setAppointmentForm({ ...appointmentForm, staff: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{staff.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                </div>
                <button type="button" onClick={addAppointment} className="mt-3 rounded-2xl bg-white px-5 py-3 text-xs font-black text-slate-950">ثبت نوبت</button>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <h3 className="font-black">نوبت‌ها</h3>
                <div className="mt-4 space-y-2">{appointments.map((item) => <div key={item.id} className="grid gap-2 rounded-2xl border border-white/10 p-4 sm:grid-cols-[100px_1fr_1fr_auto] sm:items-center"><b className="text-sm">{item.time}</b><span className="text-xs">{item.customer}</span><span className="text-xs text-slate-400">{item.service} · {item.staff}</span><div className="flex gap-2">{item.status === "رزرو" && <><button type="button" onClick={() => updateAppointment(item.id, "انجام شد")} className="rounded-xl bg-emerald-400 px-3 py-2 text-[10px] font-black text-slate-950">تکمیل</button><button type="button" onClick={() => updateAppointment(item.id, "لغو شد")} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-bold">لغو</button></>}<span className="rounded-xl border border-white/10 px-3 py-2 text-[10px] text-slate-400">{item.status}</span></div></div>)}</div>
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
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <select value={paymentForm.customer} onChange={(e) => setPaymentForm({ ...paymentForm, customer: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{customers.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                <select value={paymentForm.service} onChange={(e) => { const service = services.find((item) => item.name === e.target.value); setPaymentForm({ ...paymentForm, service: e.target.value, amount: String(service?.price ?? paymentForm.amount) }); }} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">{services.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="مبلغ ریال" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none" />
                <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as Payment["method"] })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"><option>کارت</option><option>نقدی</option></select>
              </div>
              <button type="button" onClick={addPayment} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">ثبت پرداخت</button>
              <div className="space-y-2">{payments.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs"><span>{item.customer} · {item.service} · {item.method}</span><b>{toman.format(item.amount)} ریال</b></div>)}</div>
            </div>
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
              <button type="button" onClick={() => notify("تنظیمات ذخیره شد.")} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">ذخیره تنظیمات</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
