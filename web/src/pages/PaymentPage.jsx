import { useCallback, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Link, useParams } from "react-router-dom";
import CheckoutForm from "../components/CheckoutForm";
import fallbackCarImage from "../assets/hero.png";
import { stripePromise } from "../stripe";

const stripeOptions = {
  appearance: {
    theme: "stripe",
    variables: {
      colorPrimary: "#2563eb",
      colorText: "#0f172a",
      borderRadius: "14px",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    },
  },
};

function PaymentPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const receiveBooking = useCallback((value) => setBooking(value), []);

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-20">
      <section className="relative overflow-hidden bg-slate-950 px-5 pb-32 pt-14 text-white">
        <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute left-1/3 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <Link to="/my-bookings" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">← Back to My Bookings</Link>
          <div className="mt-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" />Secure checkout</div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Complete your payment</h1>
            <p className="mt-4 text-lg leading-8 text-slate-400">Review your journey and pay securely to keep your booking moving.</p>
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-20 grid max-w-6xl gap-7 px-5 lg:grid-cols-[1.08fr_.92fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.12)] sm:p-8">
          <div className="mb-7 flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Payment details</p><h2 className="mt-2 text-2xl font-black text-slate-950">Card payment</h2></div>
            <div className="flex gap-1.5">{["VISA", "MC", "AMEX"].map((card) => <span key={card} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[9px] font-black text-slate-500">{card}</span>)}</div>
          </div>
          <Elements stripe={stripePromise} options={stripeOptions}>
            <CheckoutForm bookingId={bookingId} onBookingLoaded={receiveBooking} />
          </Elements>
        </section>

        <aside className="h-fit overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,.18)]">
          <div className="border-b border-white/10 p-6 sm:p-8">
            <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">Order summary</p><h2 className="mt-2 text-2xl font-black">Booking #{bookingId}</h2></div><span className="rounded-full bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold uppercase text-amber-300">Awaiting payment</span></div>
          </div>

          {booking ? (
            <>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.06] p-3">
                  <img src={booking.car?.imageUrl || fallbackCarImage} onError={(event) => { event.currentTarget.src = fallbackCarImage; }} alt={booking.car?.name || "Booked car"} className="h-16 w-24 rounded-xl object-cover" />
                  <div><p className="font-bold">{booking.car?.name || "Your selected car"}</p><p className="mt-1 text-sm text-slate-400">{booking.car?.type || "Vehicle"}</p></div>
                </div>

                <div className="relative mt-7 space-y-6 pl-8 before:absolute before:bottom-4 before:left-[7px] before:top-4 before:border-l before:border-dashed before:border-slate-600">
                  <div className="relative"><span className="absolute -left-8 top-1 h-4 w-4 rounded-full border-4 border-blue-950 bg-blue-400 ring-4 ring-slate-950" /><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pickup</p><p className="mt-1 text-sm leading-6 text-slate-200">{booking.pickupAddress}</p></div>
                  <div className="relative"><span className="absolute -left-8 top-1 h-4 w-4 rounded-full border-4 border-rose-950 bg-rose-400 ring-4 ring-slate-950" /><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Destination</p><p className="mt-1 text-sm leading-6 text-slate-200">{booking.dropAddress}</p></div>
                </div>

                <div className="mt-7 grid grid-cols-3 gap-2">
                  {[["Date", booking.travelDate], ["Time", String(booking.travelTime).slice(0, 5)], ["Distance", booking.distanceKm + " km"]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/[.06] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 truncate text-xs font-bold text-slate-200">{value}</p></div>)}
                </div>
              </div>
              <div className="border-t border-white/10 bg-white/[.04] p-6 sm:p-8">
                <div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Total due</p><p className="mt-1 text-xs text-slate-500">Charged securely in CAD</p></div><p className="text-4xl font-black">{"$" + Number(booking.totalPrice).toFixed(2)}</p></div>
              </div>
            </>
          ) : (
            <div className="space-y-4 p-8"><div className="h-24 animate-pulse rounded-2xl bg-white/10" /><div className="h-32 animate-pulse rounded-2xl bg-white/[.06]" /><div className="h-16 animate-pulse rounded-2xl bg-white/10" /></div>
          )}
        </aside>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap justify-center gap-x-8 gap-y-3 px-5 text-xs font-semibold text-slate-400">
        <span>🔒 256-bit encrypted checkout</span><span>🛡 Fraud monitoring</span><span>↩ Eligible cancellations are refunded</span>
      </div>
    </main>
  );
}

export default PaymentPage;
