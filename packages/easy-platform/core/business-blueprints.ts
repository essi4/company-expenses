import type { BusinessCategory, BusinessModule, ModuleState } from "./types";
import { CORE_MODULES, getDefaultModules } from "./business-modules";

export type BusinessBlueprint = {
  category: BusinessCategory;
  title: string;
  icon: string;
  modes: { value: string; label: string }[];
  defaultModules: BusinessModule[];
  recommendedFeatures: string[];
};

const modes: Record<BusinessCategory, { value:string; label:string }[]> = {
  Beauty: [{value:"Women",label:"زنانه"},{value:"Men",label:"مردانه"},{value:"Unisex",label:"یونیسکس"}],
  Automotive: [{value:"Oil Change",label:"تعویض روغن"},{value:"Repair",label:"تعمیرگاه"},{value:"Car Wash",label:"کارواش"},{value:"Auto Center",label:"مرکز خدمات خودرو"},{value:"Detailing",label:"دیتیلینگ"}],
  Medical: [{value:"Clinic",label:"کلینیک"},{value:"Doctor Office",label:"مطب"},{value:"Dental",label:"دندانپزشکی"},{value:"Laboratory",label:"آزمایشگاه"},{value:"Pharmacy",label:"داروخانه"}],
  Retail: [{value:"Store",label:"فروشگاه"},{value:"Boutique",label:"بوتیک"},{value:"Supermarket",label:"سوپرمارکت"},{value:"Online Store",label:"فروشگاه آنلاین"}],
  Services: [{value:"General",label:"خدمات"},{value:"Agency",label:"آژانس"},{value:"Repair Service",label:"خدمات تعمیراتی"},{value:"Consulting",label:"مشاوره"}],
  Hospitality: [{value:"Restaurant",label:"رستوران"},{value:"Cafe",label:"کافه"},{value:"Hotel",label:"هتل"},{value:"Takeaway",label:"بیرون‌بر"}],
  Education: [{value:"School",label:"مدرسه"},{value:"Institute",label:"آموزشگاه"},{value:"Course Center",label:"مرکز آموزش"},{value:"Tutor",label:"مدرس خصوصی"}],
  Fitness: [{value:"Gym",label:"باشگاه"},{value:"Studio",label:"استودیو"},{value:"Personal Training",label:"مربی شخصی"}],
  Professional: [{value:"Office",label:"دفتر"},{value:"Law",label:"حقوقی"},{value:"Accounting",label:"حسابداری"},{value:"Real Estate",label:"املاک"}],
  Other: [{value:"Custom",label:"سفارشی"}],
};

const titles: Record<BusinessCategory,string> = {
  Beauty:"زیبایی و آرایش",
  Automotive:"خدمات خودرو",
  Medical:"سلامت و پزشکی",
  Retail:"خرده‌فروشی",
  Services:"خدمات",
  Hospitality:"مهمان‌نوازی",
  Education:"آموزش",
  Fitness:"ورزش و تناسب‌اندام",
  Professional:"خدمات حرفه‌ای",
  Other:"کسب‌وکار سفارشی",
};

const icons: Record<BusinessCategory,string> = {
  Beauty:"✦", Automotive:"🚗", Medical:"✚", Retail:"▦", Services:"◆",
  Hospitality:"⌂", Education:"◫", Fitness:"◉", Professional:"◇", Other:"＋",
};

const recommended: Record<BusinessCategory,string[]> = {
  Beauty:["تقویم نوبت","کارتخوان","پروفایل مشتری","رزرو آنلاین","وفاداری مشتری"],
  Automotive:["پذیرش خودرو","VIN/پلاک","قطعات","سابقه سرویس","کارتخوان"],
  Medical:["پرونده مراجع","نوبت","رضایت‌نامه","پرداخت","حریم خصوصی"],
  Retail:["کالا","بارکد","انبار","صندوق","کارتخوان"],
  Services:["سفارش کار","فاکتور","پرداخت","مشتری","گردش کار"],
  Hospitality:["میز/رزرو","منو","سفارش","صندوق","باشگاه مشتریان"],
  Education:["هنرجو","کلاس","حضور و غیاب","شهریه","مدرس"],
  Fitness:["عضویت","برنامه","جلسه","مربی","تمدید"],
  Professional:["پرونده مشتری","وظایف","صورتحساب","پرداخت","اسناد"],
  Other:["مشتری","خدمات","پرداخت","گزارش","اتوماسیون"],
};

export function getBusinessBlueprint(category: BusinessCategory): BusinessBlueprint {
  const enabled = new Set(getDefaultModules(category).filter((x) => x.enabled).map((x) => x.module));
  const defaultModules: BusinessModule[] = CORE_MODULES.map((m) => ({
    id: m.id,
    state: enabled.has(m.id) ? "enabled" : "disabled" as ModuleState,
  }));
  return { category, title: titles[category], icon: icons[category], modes: modes[category], defaultModules, recommendedFeatures: recommended[category] };
}
