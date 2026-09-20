"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BeautyWorkspace from "./beauty-workspace";
import type { BusinessCategory } from "@/packages/easy-platform/core/types";
import { getBusinessBlueprint } from "@/packages/easy-platform/core/business-blueprints";

type Business = {
  id: string;
  name: string;
  slug: string;
  type: "Beauty" | "Automotive" | "Medical" | "Services";
  mode: string;
  plan: "Starter" | "Professional" | "Enterprise";
  status: "Active" | "Trial" | "Suspended";
  owner: string;
  updated: string;
};

const seedBusinesses: Business[] = [
  { id: "BUS-001", name: "EASY Demo Beauty", slug: "easy-demo-beauty", type: "Beauty", mode: "Women", plan: "Professional", status: "Active", owner: "demo@easy.local", updated: "امروز" },
  { id: "BUS-002", name: "EASY Auto Center", slug: "easy-auto-center", type: "Automotive", mode: "Oil Change", plan: "Starter", status: "Trial", owner: "auto@easy.local", updated: "دیروز" },
  { id: "BUS-003", name: "EASY Clinic", slug: "easy-clinic", type: "Medical", mode: "Clinic", plan: "Enterprise", status: "Active", owner: "clinic@easy.local", updated: "۲ روز قبل" },
  { id: "BUS-004", name: "پازل", slug: "puzzle-barber", type: "Beauty", mode: "Men", plan: "Professional", status: "Active", owner: "puzzle@easy.local", updated: "امروز" },
];

const navSections = [
  { id: "overview", label: "داشبورد", en: "", icon: "⌂" },
  { id: "businesses", label: "مدیریت کسب‌وکارها", en: "", icon: "▣" },
  { id: "users", label: "کاربران و دسترسی", en: "", icon: "♙" },
  { id: "subscriptions", label: "اشتراک‌ها و پلن‌ها", en: "", icon: "◆" },
  { id: "marketplace", label: "بازارچه", en: "", icon: "⬢" },
  { id: "ai", label: "هوش مصنوعی EASY", en: "", icon: "✦" },
  { id: "governance", label: "حاکمیت و سیاست‌گذاری", en: "", icon: "◈" },
  { id: "identity", label: "هویت و دسترسی", en: "", icon: "◎" },
  { id: "infrastructure", label: "زیرساخت جهانی", en: "", icon: "◇" },
  { id: "data", label: "داده و تحلیل", en: "", icon: "▤" },
  { id: "developers", label: "پلتفرم توسعه‌دهندگان", en: "", icon: "</>" },
  { id: "partners", label: "شرکای تجاری", en: "", icon: "∞" },
  { id: "reliability", label: "پایداری و بازیابی", en: "", icon: "◉" },
  { id: "security", label: "مرکز امنیت", en: "", icon: "⬟" },
  { id: "enterprise", label: "کنترل سازمانی", en: "", icon: "▦" },
  { id: "architecture", label: "قفل معماری", en: "", icon: "⌘" },
];

const moduleCards: Record<string, { title: string; description: string; stats: [string, string][] }> = {
  users: { title: "کاربران و دسترسی", description: "مدیریت User، Role، Permission، Membership و نشست‌های ادمین.", stats: [["Users", "احراز هویت"], ["Roles", "نقش‌ها"], ["Audit", "ثبت رویداد"]] },
  subscriptions: { title: "اشتراک‌ها و Billing", description: "پلن‌ها، اشتراک فعال، مصرف، فاکتور و Ledger در Control Plane.", stats: [["Plans", "پلن‌ها"], ["Meters", "مصرف"], ["Invoices", "فاکتورها"]] },
  marketplace: { title: "Marketplace", description: "اپلیکیشن‌ها، نسخه‌ها، نصب‌ها و Entitlementهای هر Business.", stats: [["Apps", "اپ‌ها"], ["Versions", "نسخه‌ها"], ["Entitlements", "مجوزها"]] },
  ai: { title: "EASY AI Platform", description: "مدل‌ها، Agentها، Policyها، اجرای AI و مجوز ابزارها.", stats: [["Models", "مدل‌ها"], ["Agents", "Agentها"], ["Runs", "AI Runs"]] },
  governance: { title: "Governance & Policy", description: "Policy، Rule، Approval، Violation و حاکمیت قابل ردیابی.", stats: [["Policies", "سیاست‌ها"], ["Rules", "قواعد"], ["Approvals", "تأییدها"]] },
  identity: { title: "Identity & Access 2.0", description: "Identity Provider، Session، Role Assignment و Access Log.", stats: [["Providers", "Provider"], ["Sessions", "نشست‌ها"], ["Logs", "لاگ‌ها"]] },
  infrastructure: { title: "Global Infrastructure", description: "Region، Routing، Failover و Residency Policy.", stats: [["Regions", "Regionها"], ["Routing", "Routing"], ["Failover", "Failover"]] },
  data: { title: "Data Platform & Analytics", description: "Source، Dimensions، Facts، Semantic Metrics و Jobهای تحلیلی.", stats: [["Sources", "منابع"], ["Metrics", "Metricها"], ["Jobs", "Jobها"]] },
  developers: { title: "Developer Platform & SDK", description: "Developer App، API Key، API Version، Usage و SDK Release.", stats: [["Apps", "Developer Apps"], ["API Keys", "کلیدها"], ["SDK", "Releaseها"]] },
  partners: { title: "Marketplace Economy", description: "Partner، Commission، Settlement، Payout و Revenue Share.", stats: [["Partners", "همکاران"], ["Commission", "کمیسیون"], ["Payout", "پرداخت"]] },
  reliability: { title: "Reliability & Disaster Recovery", description: "SLO، Incident، Backup، Restore Point و DR Run.", stats: [["SLO", "سیاست‌ها"], ["Incidents", "رخدادها"], ["Backups", "پشتیبان‌ها"]] },
  security: { title: "Security Operations Center", description: "Finding، Detection، Incident، Playbook و Evidence.", stats: [["Findings", "یافته‌ها"], ["Incidents", "حوادث"], ["Playbooks", "Playbookها"]] },
  enterprise: { title: "Enterprise Control Plane", description: "عملیات، Rollout، Tenant Flag، Admin Session و Audit.", stats: [["Actions", "عملیات"], ["Rollouts", "Rollout"], ["Audit", "Audit"]] },
  architecture: { title: "Architecture Lock", description: "نسخه‌های معماری، تصمیم‌ها، Change Request و Lock Window.", stats: [["Version", "Architecture"], ["Decisions", "تصمیم‌ها"], ["Changes", "تغییرات"]] },
};

function badgeClass(status: Business["status"]) {
  if (status === "Active") return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";
  if (status === "Trial") return "bg-amber-400/10 text-amber-200 border-amber-400/20";
  return "bg-rose-400/10 text-rose-200 border-rose-400/20";
}

export default function ControlCenterClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("section") ?? "businesses";
  const section = navSections.some((item) => item.id === requested) ? requested : "businesses";

  const [businesses, setBusinesses] = useState(seedBusinesses);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Business | null>(null);
  const [workspaceBusiness, setWorkspaceBusiness] = useState<Business | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", type: "Beauty" as Business["type"], mode: "Women", plan: "Starter" as Business["plan"], owner: "" });

  const current = navSections.find((item) => item.id === section) ?? navSections[1];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((business) => {
      const matchesQuery = !q || [business.name, business.slug, business.id, business.owner].some((v) => v.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || business.status === statusFilter;
      const matchesType = typeFilter === "all" || business.type === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [businesses, query, statusFilter, typeFilter]);

  const counts = {
    all: businesses.length,
    active: businesses.filter((b) => b.status === "Active").length,
    trial: businesses.filter((b) => b.status === "Trial").length,
    suspended: businesses.filter((b) => b.status === "Suspended").length,
  };

  function go(id: string) {
    router.replace(`/control-center?section=${id}`, { scroll: false });
  }

  function createBusiness() {
    if (!createForm.name.trim()) return;
    const id = `BUS-${String(businesses.length + 1).padStart(3, "0")}`;
    const slug = createForm.name.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, "-").replace(/^-|-$/g, "") || id.toLowerCase();
    const business: Business = {
      id,
      name: createForm.name.trim(),
      slug,
      type: createForm.type,
      mode: createForm.mode,
      plan: createForm.plan,
      status: "Trial",
      owner: createForm.owner.trim() || userEmail,
      updated: "همین الان",
    };
    setBusinesses((items) => [business, ...items]);
    setCreateForm({ name: "", type: "Beauty", mode: "Women", plan: "Starter", owner: "" });
    setShowCreate(false);
    setSelected(business);
    go("businesses");
  }

  const modeOptions = Object.fromEntries(
    (["Beauty","Automotive","Medical","Retail","Services","Hospitality","Education","Fitness","Professional","Other"] as BusinessCategory[]).map((category) => [category, getBusinessBlueprint(category).modes])
  ) as Record<BusinessCategory, { value: string; label: string }[]>;
