export default function Loading() {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <section className="w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-slate-900" />
        <h1 className="mt-5 text-xl font-black text-slate-950">مدیریت مالی شرکت</h1>
        <p className="mt-2 text-sm text-slate-500">در حال آماده‌سازی اطلاعات...</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-slate-900" /></div>
      </section>
    </main>
  );
}
