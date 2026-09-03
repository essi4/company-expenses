"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        window.location.href = "/";
      } else {
        if (!companyName.trim()) throw new Error("نام شرکت را وارد کنید.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { company_name: companyName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (error) throw error;
        if (data.session) window.location.href = "/";
        else setMessage("ثبت‌نام انجام شد. اگر تأیید ایمیل فعال باشد، لینک ورود به ایمیل شما ارسال شده است.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "ورود ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white">▣</div>
          <h1 className="text-2xl font-black">مدیریت مالی شرکت</h1>
          <p className="mt-1 text-sm text-slate-500">ورود امن به حساب شرکت</p>
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div>}
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">نام شرکت</span>
              <input required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" placeholder="مثلاً شرکت نمونه" />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">ایمیل</span>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" placeholder="name@example.com" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">رمز عبور</span>
            <input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" placeholder="حداقل ۶ کاراکتر" />
          </label>
          <button disabled={busy} className="w-full rounded-xl bg-slate-900 px-4 py-3.5 font-black text-white disabled:opacity-50">
            {busy ? "لطفاً صبر کنید…" : mode === "login" ? "ورود به حساب" : "ساخت حساب شرکت"}
          </button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }} className="mt-4 w-full text-sm font-bold text-slate-500 underline">
          {mode === "login" ? "حساب شرکت ندارید؟ ثبت‌نام کنید" : "حساب دارید؟ وارد شوید"}
        </button>
      </div>
    </main>
  );
}
