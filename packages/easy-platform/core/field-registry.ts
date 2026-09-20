export type FieldKind = "text" | "phone" | "email" | "number" | "money" | "select" | "multiselect" | "toggle" | "textarea" | "date" | "time" | "color" | "image";
export type FieldScope = "platform" | "business" | "customer" | "staff" | "service" | "appointment" | "invoice" | "payment";

export type FieldDefinition = {
  id: string;
  label: string;
  kind: FieldKind;
  scope: FieldScope;
  required?: boolean;
  searchable?: boolean;
  sensitive?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  help?: string;
};

export const BUSINESS_FIELDS: FieldDefinition[] = [
  {id:"business.name",label:"نام کسب‌وکار",kind:"text",scope:"business",required:true,searchable:true,placeholder:"مثلاً آرایشگاه پازل"},
  {id:"business.legal_name",label:"نام حقوقی",kind:"text",scope:"business",searchable:true},
  {id:"business.category",label:"دسته کسب‌وکار",kind:"select",scope:"business",required:true},
  {id:"business.mode",label:"نوع فعالیت",kind:"select",scope:"business",required:true},
  {id:"business.slug",label:"شناسه وب",kind:"text",scope:"business",required:true,searchable:true,help:"شناسه پایدار Workspace و URL کسب‌وکار"},
  {id:"business.phone",label:"تلفن",kind:"phone",scope:"business",searchable:true},
  {id:"business.email",label:"ایمیل",kind:"email",scope:"business"},
  {id:"business.website",label:"وب‌سایت",kind:"text",scope:"business"},
  {id:"business.country",label:"کشور",kind:"select",scope:"business",required:true},
  {id:"business.locale",label:"زبان",kind:"select",scope:"business",required:true},
  {id:"business.timezone",label:"منطقه زمانی",kind:"select",scope:"business",required:true},
  {id:"business.currency",label:"واحد پول",kind:"select",scope:"business",required:true},
  {id:"business.address",label:"نشانی",kind:"textarea",scope:"business"},
  {id:"business.postal_code",label:"کد پستی",kind:"text",scope:"business"},
  {id:"business.tax_id",label:"شناسه مالیاتی",kind:"text",scope:"business",sensitive:true},
  {id:"business.logo",label:"لوگو",kind:"image",scope:"business"},
  {id:"business.online_booking",label:"رزرو آنلاین",kind:"toggle",scope:"business"},
  {id:"business.invoice_enabled",label:"ماژول فاکتور",kind:"toggle",scope:"business"},
  {id:"business.invoice_optional",label:"فاکتور اختیاری",kind:"toggle",scope:"business"},
  {id:"business.card_terminal",label:"کارتخوان",kind:"toggle",scope:"business"},
  {id:"business.cash_payment",label:"دریافت نقدی",kind:"toggle",scope:"business"},
  {id:"business.transfer_payment",label:"دریافت انتقالی",kind:"toggle",scope:"business"},
];

export const CUSTOMER_FIELDS: FieldDefinition[] = [
  {id:"customer.name",label:"نام مشتری",kind:"text",scope:"customer",required:true,searchable:true},
  {id:"customer.phone",label:"شماره موبایل",kind:"phone",scope:"customer",required:true,searchable:true},
  {id:"customer.email",label:"ایمیل",kind:"email",scope:"customer",searchable:true},
  {id:"customer.notes",label:"یادداشت",kind:"textarea",scope:"customer"},
  {id:"customer.tags",label:"برچسب‌ها",kind:"multiselect",scope:"customer",searchable:true},
];

export const PAYMENT_FIELDS: FieldDefinition[] = [
  {id:"payment.amount",label:"مبلغ",kind:"money",scope:"payment",required:true,min:0},
  {id:"payment.method",label:"روش پرداخت",kind:"select",scope:"payment",required:true,options:[
    {value:"card_terminal",label:"کارتخوان"},{value:"cash",label:"نقدی"},{value:"transfer",label:"انتقال"},{value:"mixed",label:"ترکیبی"}
  ]},
  {id:"payment.reference",label:"شماره پیگیری",kind:"text",scope:"payment",searchable:true},
  {id:"payment.note",label:"یادداشت پرداخت",kind:"textarea",scope:"payment"},
];
