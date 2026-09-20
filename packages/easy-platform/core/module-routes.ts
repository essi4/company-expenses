import type { CoreModule } from "./business-modules";

export type BusinessModuleRoute = {
  module: CoreModule;
  path: string;
  title: string;
  icon: string;
  group: "operations" | "commerce" | "finance" | "engagement" | "analytics";
};

export const BUSINESS_MODULE_ROUTES: BusinessModuleRoute[] = [
  { module:"customers", path:"customers", title:"مشتریان", icon:"♙", group:"operations" },
  { module:"appointments", path:"appointments", title:"نوبت‌ها", icon:"◷", group:"operations" },
  { module:"catalog", path:"catalog", title:"خدمات و کالا", icon:"▦", group:"commerce" },
  { module:"staff", path:"staff", title:"کارکنان", icon:"◎", group:"operations" },
  { module:"invoicing", path:"invoices", title:"فاکتورها", icon:"▤", group:"finance" },
  { module:"payments", path:"payments", title:"پرداخت‌ها", icon:"◆", group:"finance" },
  { module:"cashier", path:"cashier", title:"صندوق", icon:"▣", group:"finance" },
  { module:"ledger", path:"ledger", title:"دفتر مالی", icon:"≡", group:"finance" },
  { module:"inventory", path:"inventory", title:"انبار", icon:"□", group:"commerce" },
  { module:"reports", path:"reports", title:"گزارش‌ها", icon:"▤", group:"analytics" },
  { module:"online_booking", path:"booking", title:"رزرو آنلاین", icon:"◫", group:"engagement" },
  { module:"notifications", path:"notifications", title:"اعلان‌ها", icon:"◉", group:"engagement" },
];

export function getBusinessRoute(path: string) {
  return BUSINESS_MODULE_ROUTES.find((route) => route.path === path);
}
