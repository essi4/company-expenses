import type { BusinessCategory } from "./types";
export type BusinessMode = string;
export type CoreModule =
  | "customers" | "appointments" | "catalog" | "staff"
  | "invoicing" | "payments" | "cashier" | "ledger"
  | "inventory" | "reports" | "online_booking" | "notifications";

export type BusinessModuleConfig = {
  module: CoreModule;
  enabled: boolean;
  required?: boolean;
  settings?: Record<string, unknown>;
};

export const CORE_MODULES: { id: CoreModule; title: string; description: string }[] = [
  { id: "customers", title: "مشتریان", description: "مدیریت مشتری، پرونده و ارتباطات" },
  { id: "appointments", title: "نوبت‌ها", description: "رزرو، تقویم و وضعیت نوبت" },
  { id: "catalog", title: "خدمات و کالا", description: "کاتالوگ خدمات، محصولات و قیمت‌ها" },
  { id: "staff", title: "کارکنان", description: "کارکنان، نقش‌ها و ظرفیت کاری" },
  { id: "invoicing", title: "فاکتور", description: "فاکتور، رسید و اسناد فروش" },
  { id: "payments", title: "پرداخت", description: "کارتخوان، نقدی، انتقال و پرداخت ترکیبی" },
  { id: "cashier", title: "صندوق", description: "دریافت، پرداخت و شیفت صندوق" },
  { id: "ledger", title: "دفتر مالی", description: "ثبت رویدادهای مالی و تسویه" },
  { id: "inventory", title: "انبار", description: "موجودی، ورود و خروج کالا" },
  { id: "reports", title: "گزارش‌ها", description: "گزارش عملیاتی و مالی" },
  { id: "online_booking", title: "رزرو آنلاین", description: "رزرو از Customer Portal" },
  { id: "notifications", title: "اعلان‌ها", description: "پیام، یادآوری و کمپین" },
];

export const DEFAULT_MODULES: Record<BusinessCategory, CoreModule[]> = {
  Beauty: ["customers","appointments","catalog","staff","payments","reports","online_booking","notifications"],
  Automotive: ["customers","appointments","catalog","staff","payments","cashier","reports","inventory","notifications"],
  Medical: ["customers","appointments","catalog","staff","payments","cashier","reports","notifications"],
  Retail: ["customers","catalog","staff","payments","cashier","ledger","inventory","reports","notifications"],
  Services: ["customers","appointments","catalog","staff","payments","cashier","reports","notifications"],
  Hospitality: ["customers","appointments","catalog","staff","payments","cashier","reports","inventory","notifications"],
  Education: ["customers","appointments","catalog","staff","payments","cashier","reports","notifications"],
  Fitness: ["customers","appointments","catalog","staff","payments","cashier","reports","notifications"],
  Professional: ["customers","appointments","catalog","staff","payments","reports","notifications"],
  Other: ["customers","catalog","staff","payments","reports","notifications"],
};

export function getDefaultModules(category: BusinessCategory): BusinessModuleConfig[] {
  const enabled = new Set(DEFAULT_MODULES[category]);
  return CORE_MODULES.map((m) => ({ module: m.id, enabled: enabled.has(m.id) }));
}
