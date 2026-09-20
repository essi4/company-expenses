"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Customer = { id: string; name: string; phone: string };
type Service = { id: string; name: string; price: number; duration: number };
type Staff = { id: string; name: string; role: string };
type Appointment = { id: string; date: string; time: string; startsAt: string; customer: string; service: string; staff: string; status: "رزرو" | "انجام شد" | "لغو شد" };
type Payment = { id: string; customer: string; service: string; amount: number; method: "نقدی" | "کارت" };\ntype Invoice = { id: string; number: string; customer: string; subtotal: number; discount: number; total: number; status: string; paid: boolean; paidAmount: number };
type InvoiceDraftItem = { serviceId: string; description: string; quantity: number; unitPrice: number };

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
  { id: "demo-appointment-1", date: dateKey(), time: "۱۷:۰۰", customer: "امیر رضایی", service: "اصلاح مو", staff: "اسماعیل", status: "رزرو" },
  { id: "demo-appointment-2", date: dateKey(), time: "۱۸:۳۰", startsAt: `${dateKey()}T18:30:00`, customer: "محمد احمدی", service: "اصلاح و ریش", staff: "رضا", status: "رزرو" },
];

const initialPayments: Payment[] = [
  { id: "demo-payment-1", customer: "امیر رضایی", service: "اصلاح مو", amount: 280000, method: "کارت" },
  { id: "demo-payment-2", customer: "علی کریمی", service: "اصلاح و ریش", amount: 420000, method: "نقدی" },
];

const toman = new Intl.NumberFormat("fa-IR");
function dateKey(date = new Date()) {
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

  async function createInvoice() {
    if (!resolvedBusinessId || !invoiceCustomer || invoiceItems.length === 0) return notify("مشتری و حداقل یک خدمت را انتخاب کنید.");
    const customer = customers.find((x) => x.name === invoiceCustomer);
    if (!customer) return notify("مشتری معتبر نیست.");
    const subtotal = invoiceItems.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0);
    const discount = Math.max(0, Math.min(Number(invoiceDiscount) || 0, subtotal));
    const total = subtotal - discount;
    const invoiceNumber = `PZ-${Date.now().toString().slice(-8)}`;
    const { data: invoice, error } = await supabase.from("business_invoices").insert({
      business_id: resolvedBusinessId, customer_id: customer.id, invoice_number: invoiceNumber,
      subtotal, discount_amount: discount, total_amount: total, status: "issued"
    }).select("id,invoice_number,subtotal,discount_amount,total_amount,status").single();
    if (error || !invoice) return notify("صدور فاکتور انجام نشد.");
    const { error: itemError } = await supabase.from("business_invoice_items").insert(invoiceItems.map(x => ({
      invoice_id: invoice.id, service_id: x.serviceId, description: x.description,
      quantity: x.quantity, unit_price: x.unitPrice, discount_amount: 0, line_total: x.quantity * x.unitPrice
    })));
    if (itemError) return notify("آیتم‌های فاکتور ثبت نشد.");
    setInvoices((items) => [...items, { id: invoice.id, number: invoice.invoice_number, customer: customer.name, subtotal, discount, total, status: "صادر شده", paid: false, paidAmount: 0 }]);
    setInvoiceItems([]); setInvoiceDiscount(0);
    notify(`فاکتور ${invoiceNumber} صادر شد.`);
  }

