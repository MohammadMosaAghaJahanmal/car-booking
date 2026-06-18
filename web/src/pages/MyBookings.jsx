import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

const filters = ["all", "pending", "accepted", "completed", "cancelled"];
const badge = { pending: "bg-amber-50 text-amber-700", accepted: "bg-blue-50 text-blue-700", completed: "bg-emerald-50 text-emerald-700", cancelled: "bg-rose-50 text-rose-700" };

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  const load = async () => {
    try {
      setError("");
      const res = await API.get("/bookings/my-bookings");
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "We could not load your bookings.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      setCancelling(id);
      await API.put("/bookings/" + id + "/cancel");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "The booking could not be cancelled.");
    } finally { setCancelling(null); }
  };

  const count = (status) => bookings.filter((b) => b.status === status).length;
  const shown = useMemo(() => filter === "all" ? bookings : bookings.filter((b) => b.status === filter), [bookings, filter]);
  const paid = bookings.filter((b) => b.paymentStatus === "paid").reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

  return (
    <main className="min-h-screen bg-[#f5f7fb] pb-16">
      <section className="relative overflow-hidden bg-slate-950 px-5 pb-24 pt-14 text-white">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-blue-400">Your travel dashboard</p><h1 className="text-4xl font-bold">My Bookings</h1><p className="mt-3 text-slate-400">Track upcoming rides, payments, and past journeys.</p></div>
          <Link to="/" className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold shadow-lg hover:bg-blue-500">Book another ride &rarr;</Link>
        </div>
      </section>

      <div className="relative mx-auto -mt-14 max-w-6xl px-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {[["Upcoming rides", count("pending") + count("accepted")], ["Completed trips", count("completed")], ["Total paid", "$" + paid.toFixed(2)]].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)]"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
          ))}
        </div>

        <div className="my-7 flex gap-2 overflow-x-auto pb-2">
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={"whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold capitalize " + (filter === item ? "bg-slate-900 text-white shadow" : "border border-slate-200 bg-white text-slate-600")}>{item} <span className="ml-1 text-xs opacity-60">{item === "all" ? bookings.length : count(item)}</span></button>)}
        </div>

        {error && <div className="mb-5 flex justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><span>{error}</span><button onClick={load} className="font-bold">Try again</button></div>}
        {loading ? <div className="h-64 animate-pulse rounded-2xl bg-white" /> : <div className="space-y-5">
          {shown.map((booking) => (
            <article key={booking.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg">
              <header className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-7">
                <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-900 font-black text-white">CB</div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{booking.Car?.name || "Booked car"}</h2><span className={"rounded-full px-2.5 py-1 text-[11px] font-bold uppercase " + (badge[booking.status] || "bg-slate-100")}>{booking.status}</span></div><p className="mt-1 text-sm text-slate-500">{booking.Car?.type} &middot; Booking #{booking.id}</p></div></div>
                <div className="sm:text-right"><p className="text-xs font-semibold uppercase text-slate-400">Trip total</p><p className="text-2xl font-bold">{"$" + Number(booking.totalPrice || 0).toFixed(2)}</p></div>
              </header>
              <div className="grid gap-7 p-5 sm:px-7 lg:grid-cols-[1.4fr_1fr]">
                <div className="relative space-y-6 pl-8 before:absolute before:bottom-4 before:left-[7px] before:top-4 before:border-l before:border-dashed before:border-slate-300">
                  <div className="relative"><span className="absolute -left-8 top-1 h-4 w-4 rounded-full border-4 border-blue-100 bg-blue-600 ring-4 ring-white" /><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pickup</p><p className="mt-1 text-sm font-medium">{booking.pickupAddress}</p></div>
                  <div className="relative"><span className="absolute -left-8 top-1 h-4 w-4 rounded-full border-4 border-rose-100 bg-rose-500 ring-4 ring-white" /><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Destination</p><p className="mt-1 text-sm font-medium">{booking.dropAddress}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">{[["Date", booking.travelDate], ["Time", booking.travelTime], ["Distance", booking.distanceKm + " km"], ["Payment", booking.paymentStatus]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3.5"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold capitalize">{value}</p></div>)}</div>
              </div>
              {(booking.status === "pending" || (booking.paymentStatus === "unpaid" && booking.status !== "cancelled")) && <footer className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
                {booking.status === "pending" && <button onClick={() => cancelBooking(booking.id)} disabled={cancelling === booking.id} className="rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold hover:text-rose-600 disabled:opacity-60">{cancelling === booking.id ? "Cancelling..." : "Cancel booking"}</button>}
                {booking.paymentStatus === "unpaid" && booking.status !== "cancelled" && <Link to={"/payment/" + booking.id} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Pay now &rarr;</Link>}
              </footer>}
              {booking.status === "accepted" && <div className="border-t border-slate-100 px-5 py-4 text-right sm:px-7"><Link to={"/track/" + booking.id} className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Track driver live</Link></div>}
            </article>
          ))}
          {shown.length === 0 && !error && <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><h2 className="text-lg font-bold">No {filter === "all" ? "" : filter} bookings yet</h2><p className="mt-2 text-sm text-slate-500">Your rides will appear here after you make a booking.</p><Link to="/" className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Book a ride</Link></div>}
        </div>}
      </div>
    </main>
  );
}

export default MyBookings;
