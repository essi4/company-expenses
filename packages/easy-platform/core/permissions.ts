export type EasyPermission =
  | "business.read" | "business.update" | "business.manage_modules"
  | "customer.read" | "customer.write"
  | "appointment.read" | "appointment.write" | "appointment.cancel"
  | "service.read" | "service.write"
  | "staff.read" | "staff.write"
  | "invoice.read" | "invoice.write" | "invoice.void"
  | "payment.read" | "payment.write" | "refund.write"
  | "cashier.open" | "cashier.close"
  | "report.read" | "settings.manage";

export type EasyRole = {
  id:string;
  title:string;
  permissions: EasyPermission[];
  system?: boolean;
};

export const CORE_ROLES: EasyRole[] = [
  {id:"business_owner",title:"مالک کسب‌وکار",system:true,permissions:["business.read","business.update","business.manage_modules","customer.read","customer.write","appointment.read","appointment.write","appointment.cancel","service.read","service.write","staff.read","staff.write","invoice.read","invoice.write","invoice.void","payment.read","payment.write","refund.write","cashier.open","cashier.close","report.read","settings.manage"]},
  {id:"manager",title:"مدیر",system:true,permissions:["business.read","customer.read","customer.write","appointment.read","appointment.write","appointment.cancel","service.read","service.write","staff.read","staff.write","invoice.read","invoice.write","payment.read","payment.write","refund.write","cashier.open","cashier.close","report.read"]},
  {id:"operator",title:"اپراتور",system:true,permissions:["customer.read","customer.write","appointment.read","appointment.write","service.read","invoice.read","invoice.write","payment.read","payment.write"]},
  {id:"cashier",title:"صندوقدار",system:true,permissions:["customer.read","appointment.read","invoice.read","invoice.write","payment.read","payment.write","refund.write","cashier.open","cashier.close"]},
  {id:"staff",title:"کارکن",system:true,permissions:["customer.read","appointment.read","appointment.write","service.read"]},
];
