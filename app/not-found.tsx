export default function NotFound() {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
        <div className="text-6xl font-black tracking-tight text-slate-200">۴۰۴</div>
        <h1 className="mt-2 text-2xl font-black text-slate-950">صفحه پیدا نشد</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">این بخش حذف شده یا آدرس واردشده صحیح نیست.</p>
        <a href="/" className="mt-6 block rounded-2xl bg-slate-900 px-5 py-3 font-black text-white">بازگشت به داشبورد</a>
      </section>
    </main>
  );
}
