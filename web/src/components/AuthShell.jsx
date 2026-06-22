import { Link } from "react-router-dom";

function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f5f7fb] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto grid min-h-[680px] max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-32 -top-28 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 font-black shadow-lg shadow-blue-600/30">CB</span>
              <span className="text-lg font-bold">CarBooking</span>
            </Link>
            <div className="mt-24">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">Move better</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight">Every great journey starts with a simple booking.</h2>
              <p className="mt-5 max-w-sm leading-7 text-slate-400">Reliable cars, transparent prices, and a smooth experience from pickup to destination.</p>
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {[["24/7", "Booking"], ["100%", "Secure"], ["Easy", "Refunds"]].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}
          </div>
        </section>

        <section className="flex items-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600 lg:hidden">&larr; Back to home</Link>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
            <p className="mt-3 leading-7 text-slate-500">{description}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-7 text-center text-sm text-slate-500">{footer}</div>
            <p className="mt-10 text-center text-xs leading-5 text-slate-400">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthShell;
