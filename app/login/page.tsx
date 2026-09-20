"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "signup") setMode("signup");
  }, []);

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
        const next = new URLSearchParams(window.location.search).get("next") || "/control-center";
        window.location.href = next;
      } else {
        if (!companyName.trim()) throw new Error("نام کسب‌وکار را وارد کنید.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { company_name: companyName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (error) throw error;
        if (data.session) window.location.href = "/control-center";
        else setMessage("ثبت‌نام انجام شد. لطفاً ایمیل خود را تأیید کنید و سپس وارد شوید.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "ورود ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black text-slate-950">E</div>
          <h1 className="text-2xl font-black">ورود به EASY</h1>
          <p className="mt-1 text-sm text-slate-400">حساب پلتفرم و کسب‌وکار شما</p>
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-400/10 p-3 text-sm font-bold text-red-200">{error}</div>}
        {message && <div className="mb-4 rounded-xl bg-emerald-400/10 p-3 text-sm font-bold text-emerald-200">{message}</div>}
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-400">نام کسب‌وکار</span>
              <input required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="مثلاً سالن نمونه" />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-400">ایمیل</span>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="name@example.com" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-400">رمز عبور</span>
            <input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="حداقل ۶ کاراکتر" />
          </label>
          <button disabled={busy} className="w-full rounded-xl bg-white px-4 py-3.5 font-black text-slate-950 disabled:opacity-50">
            {busy ? "لطفاً صبر کنید…" : mode === "login" ? "ورود به حساب" : "ساخت حساب"}
          </button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }} className="mt-4 w-full text-sm font-bold text-slate-500 underline">
          {mode === "login" ? "کسب‌وکار ندارید؟ ثبت‌نام کنید" : "حساب دارید؟ وارد شوید"}
        </button>
        <Link href="/" className="mt-6 block text-center text-xs font-bold text-slate-500">بازگشت به EASY</Link>
      </div>
    </main>
  );
}
