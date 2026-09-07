"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-7 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-900 text-2xl text-white">!</div>
        <p className="mt-5 text-sm font-bold text-slate-500">مدیریت مالی شرکت</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">یک خطای غیرمنتظره رخ داد</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">اطلاعات شما حفظ می‌شود. دوباره تلاش کنید یا صفحه را تازه‌سازی کنید.</p>
        <button onClick={() => reset()} className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3 font-black text-white shadow-lg shadow-slate-900/10">تلاش دوباره</button>
      </section>
    </main>
  );
}
