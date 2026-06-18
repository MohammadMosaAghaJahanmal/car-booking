import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../api/axios";

const statusColor = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
};
const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

function BookingCalendar({ cars = [] }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => toISO(new Date()));
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [carId, setCarId] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");

  const gridStart = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    return addDays(first, -first.getDay());
  }, [month]);
  const days = useMemo(() => Array.from({ length: 42 }, (_, index) => addDays(gridStart, index)), [gridStart]);

  const loadCalendar = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const base = {
        dateFrom: toISO(days[0]), dateTo: toISO(days[41]), status, carId,
        limit: 100, sortBy: "travelDate", sortOrder: "ASC",
      };
      const first = await API.get("/bookings/all", { params: base });
      let rows = first.data.bookings;
      const pages = first.data.pagination.pages;
      if (pages > 1) {
        const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) =>
          API.get("/bookings/all", { params: { ...base, page: index + 2 } })));
        rows = rows.concat(...rest.map((response) => response.data.bookings));
      }
      setBookings(rows);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the booking calendar.");
    } finally { setLoading(false); }
  }, [days, status, carId]);

  useEffect(() => {
    // Remote calendar window changes whenever month or filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCalendar();
  }, [loadCalendar]);

  const grouped = useMemo(() => bookings.reduce((result, booking) => {
    if (!result[booking.travelDate]) result[booking.travelDate] = [];
    result[booking.travelDate].push(booking);
    return result;
  }, {}), [bookings]);

  const selectedBookings = grouped[selectedDate] || [];
  const moveMonth = (amount) => {
    const next = new Date(month.getFullYear(), month.getMonth() + amount, 1);
    setMonth(next);
    setSelectedDate(toISO(next));
  };

  const updateStatus = async (bookingId, nextStatus) => {
    try {
      setUpdating(bookingId);
      await API.put("/bookings/" + bookingId + "/status", { status: nextStatus });
      await loadCalendar();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update this booking.");
    } finally { setUpdating(null); }
  };

  return (
    <section className="mt-7 grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.06)]">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Schedule overview</p><h2 className="mt-1 text-2xl font-bold">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><p className="mt-1 text-sm text-slate-500">{bookings.length} bookings in this calendar window</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">All statuses</option>{Object.keys(statusColor).map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select value={carId} onChange={(event) => setCarId(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">All cars</option>{cars.map((car) => <option key={car.id} value={car.id}>{car.name}</option>)}</select>
            <button onClick={() => moveMonth(-1)} aria-label="Previous month" className="rounded-xl border border-slate-200 px-3 py-2.5 font-bold hover:bg-slate-50">&larr;</button>
            <button onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(toISO(now)); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">Today</button>
            <button onClick={() => moveMonth(1)} aria-label="Next month" className="rounded-xl border border-slate-200 px-3 py-2.5 font-bold hover:bg-slate-50">&rarr;</button>
          </div>
        </header>

        {error && <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">{weekdays.map((day) => <div key={day} className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = toISO(day);
            const events = grouped[key] || [];
            const currentMonth = day.getMonth() === month.getMonth();
            const selected = selectedDate === key;
            const today = key === toISO(new Date());
            return <button key={key} onClick={() => setSelectedDate(key)} className={"min-h-28 border-b border-r border-slate-100 p-2 text-left transition hover:bg-blue-50/40 sm:min-h-32 " + (selected ? "bg-blue-50 ring-2 ring-inset ring-blue-500" : "")}>
              <span className={"grid h-7 w-7 place-items-center rounded-full text-xs font-bold " + (today ? "bg-blue-600 text-white" : currentMonth ? "text-slate-700" : "text-slate-300")}>{day.getDate()}</span>
              <div className="mt-2 space-y-1">
                {events.slice(0, 3).map((booking) => <div key={booking.id} className={"truncate rounded-md border px-1.5 py-1 text-[10px] font-semibold " + statusColor[booking.status]}>{booking.travelTime?.slice(0, 5)} {booking.Car?.name}</div>)}
                {events.length > 3 && <p className="px-1 text-[10px] font-bold text-slate-400">+{events.length - 3} more</p>}
              </div>
            </button>;
          })}
        </div>
        {loading && <div className="absolute inset-0" />}
      </div>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.06)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Daily agenda</p>
        <h2 className="mt-2 text-xl font-bold">{new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>
        <p className="mt-1 text-sm text-slate-500">{selectedBookings.length} scheduled rides</p>
        <div className="mt-5 space-y-3">
          {selectedBookings.map((booking) => <article key={booking.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-blue-600">#{booking.id} at {booking.travelTime?.slice(0, 5)}</p><h3 className="mt-1 font-bold">{booking.Car?.name}</h3><p className="text-xs text-slate-500">{booking.User?.name}</p></div><span className={"rounded-full border px-2 py-1 text-[10px] font-bold uppercase " + statusColor[booking.status]}>{booking.status}</span></div>
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500"><p className="truncate">From: {booking.pickupAddress}</p><p className="truncate">To: {booking.dropAddress}</p></div>
            <select value={booking.status} disabled={updating === booking.id} onChange={(event) => updateStatus(booking.id, event.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold disabled:opacity-50">{Object.keys(statusColor).map((value) => <option key={value} value={value}>{value}</option>)}</select>
          </article>)}
          {!loading && selectedBookings.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center"><p className="font-semibold text-slate-600">No rides scheduled</p><p className="mt-1 text-xs text-slate-400">Select another day to view its agenda.</p></div>}
          {loading && <p className="py-10 text-center text-sm text-slate-400">Loading schedule...</p>}
        </div>
      </aside>
    </section>
  );
}
export default BookingCalendar;
