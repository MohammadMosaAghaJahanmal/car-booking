import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";

const emptyCar = { name: "", type: "", pricePerKm: "" };
const badge = {
  pending: "bg-amber-50 text-amber-700", accepted: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700", cancelled: "bg-rose-50 text-rose-700",
};

function AdminDashboard() {
  const [section, setSection] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, accepted: 0, completed: 0, cancelled: 0, revenue: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({ search: "", status: "", paymentStatus: "", carId: "", dateFrom: "", dateTo: "", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "DESC" });
  const [carForm, setCarForm] = useState(emptyCar);
  const [editingCar, setEditingCar] = useState(null);
  const [carSearch, setCarSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingCar, setSavingCar] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState(null);
  const [notice, setNotice] = useState({ type: "", text: "" });

  const loadCars = async () => {
    try {
      const res = await API.get("/cars", { params: { sortBy: "name" } });
      setCars(res.data);
    } catch (err) { setNotice({ type: "error", text: err.response?.data?.message || "Could not load cars." }); }
  };

  useEffect(() => { loadCars(); }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await API.get("/bookings/all", { params: filters });
        setBookings(res.data.bookings);
        setPagination(res.data.pagination);
        setSummary(res.data.summary);
      } catch (err) {
        setNotice({ type: "error", text: err.response?.data?.message || "Could not load bookings." });
      } finally { setLoading(false); }
    }, filters.search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [filters]);

  const changeFilter = (name, value) => setFilters((prev) => ({ ...prev, [name]: value, page: name === "page" ? value : 1 }));
  const resetFilters = () => setFilters({ search: "", status: "", paymentStatus: "", carId: "", dateFrom: "", dateTo: "", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "DESC" });

  const refreshBookings = () => setFilters((prev) => ({ ...prev }));

  const updateStatus = async (id, status) => {
    try {
      setUpdatingBooking(id);
      await API.put("/bookings/" + id + "/status", { status });
      setNotice({ type: "success", text: "Booking status updated." });
      refreshBookings();
    } catch (err) {
      setNotice({ type: "error", text: err.response?.data?.message || "Could not update booking." });
    } finally { setUpdatingBooking(null); }
  };

  const saveCar = async (e) => {
    e.preventDefault();
    try {
      setSavingCar(true);
      const payload = { ...carForm, pricePerKm: Number(carForm.pricePerKm) };
      if (editingCar) await API.put("/cars/" + editingCar, payload);
      else await API.post("/cars", payload);
      setNotice({ type: "success", text: editingCar ? "Car updated successfully." : "New car added successfully." });
      setCarForm(emptyCar);
      setEditingCar(null);
      await loadCars();
    } catch (err) {
      setNotice({ type: "error", text: err.response?.data?.message || "Could not save car." });
    } finally { setSavingCar(false); }
  };

  const startEdit = (car) => {
    setEditingCar(car.id);
    setCarForm({ name: car.name, type: car.type, pricePerKm: car.pricePerKm });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteCar = async (car) => {
    if (!window.confirm("Delete " + car.name + "? This cannot be undone.")) return;
    try {
      await API.delete("/cars/" + car.id);
      setNotice({ type: "success", text: "Car deleted." });
      await loadCars();
    } catch (err) { setNotice({ type: "error", text: err.response?.data?.message || "Could not delete car." }); }
  };

  const visibleCars = useMemo(() => {
    const term = carSearch.trim().toLowerCase();
    return term ? cars.filter((car) => car.name.toLowerCase().includes(term) || car.type.toLowerCase().includes(term)) : cars;
  }, [cars, carSearch]);

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  return (
    <main className="min-h-screen bg-[#f5f7fb] pb-16">
      <section className="bg-slate-950 px-5 pb-24 pt-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">Control center</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Admin Dashboard</h1><p className="mt-3 text-slate-400">Manage every booking and vehicle from one place.</p></div>
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            {["bookings", "cars"].map((item) => <button key={item} onClick={() => setSection(item)} className={"rounded-lg px-5 py-2.5 text-sm font-semibold capitalize transition " + (section === item ? "bg-white text-slate-950 shadow" : "text-slate-400 hover:text-white")}>{item}</button>)}
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-14 max-w-7xl px-5">
        {notice.text && <div className={"mb-5 flex items-center justify-between rounded-xl border px-5 py-4 text-sm font-medium " + (notice.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700")}><span>{notice.text}</span><button onClick={() => setNotice({ type: "", text: "" })} className="text-lg">x</button></div>}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[["Total bookings", summary.total, "text-slate-900"], ["Pending", summary.pending, "text-amber-600"], ["Accepted", summary.accepted, "text-blue-600"], ["Completed", summary.completed, "text-emerald-600"], ["Paid revenue", "$" + Number(summary.revenue).toFixed(2), "text-violet-600"]].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.06)]"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className={"mt-2 text-2xl font-bold " + color}>{value}</p></div>)}
        </div>

        {section === "bookings" ? (
          <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.06)]">
            <div className="border-b border-slate-100 p-5 lg:p-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div><h2 className="text-xl font-bold">All bookings</h2><p className="mt-1 text-sm text-slate-500">{pagination.total} results match your filters</p></div>
                <div className="relative w-full lg:max-w-md"><input value={filters.search} onChange={(e) => changeFilter("search", e.target.value)} placeholder="Search ID, customer, email, car or location..." className={inputClass + " pl-10"} /><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></span></div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <select value={filters.status} onChange={(e) => changeFilter("status", e.target.value)} className={inputClass}><option value="">All statuses</option>{["pending", "accepted", "completed", "cancelled"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <select value={filters.paymentStatus} onChange={(e) => changeFilter("paymentStatus", e.target.value)} className={inputClass}><option value="">All payments</option>{["unpaid", "paid", "refunded"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <select value={filters.carId} onChange={(e) => changeFilter("carId", e.target.value)} className={inputClass}><option value="">All cars</option>{cars.map((car) => <option key={car.id} value={car.id}>{car.name}</option>)}</select>
                <input type="date" title="From date" value={filters.dateFrom} onChange={(e) => changeFilter("dateFrom", e.target.value)} className={inputClass} />
                <input type="date" title="To date" value={filters.dateTo} onChange={(e) => changeFilter("dateTo", e.target.value)} className={inputClass} />
                <button onClick={resetFilters} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Reset filters</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Booking</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Route</th><th className="px-5 py-4">Schedule</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? <tr><td colSpan="6" className="px-5 py-16 text-center text-sm text-slate-500">Loading bookings...</td></tr> : bookings.map((booking) => (
                    <tr key={booking.id} className="align-top transition hover:bg-slate-50/70">
                      <td className="px-5 py-5"><p className="font-bold text-slate-900">#{booking.id}</p><p className="mt-1 text-sm text-slate-500">{booking.Car?.name}</p><p className="text-xs text-slate-400">{booking.Car?.type}</p></td>
                      <td className="px-5 py-5"><p className="font-semibold text-slate-800">{booking.User?.name || "Unknown"}</p><p className="mt-1 text-sm text-slate-500">{booking.User?.email || "User #" + booking.UserId}</p></td>
                      <td className="max-w-xs px-5 py-5"><div className="space-y-2 text-sm"><p className="truncate text-slate-700"><span className="mr-2 text-blue-600">x</span>{booking.pickupAddress}</p><p className="truncate text-slate-700"><span className="mr-2 text-rose-500">x</span>{booking.dropAddress}</p><p className="text-xs text-slate-400">{booking.distanceKm} km</p></div></td>
                      <td className="px-5 py-5"><p className="text-sm font-semibold text-slate-700">{booking.travelDate}</p><p className="mt-1 text-sm text-slate-500">{booking.travelTime}</p></td>
                      <td className="px-5 py-5"><p className="font-bold">{"$" + Number(booking.totalPrice).toFixed(2)}</p><span className={"mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase " + (booking.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : booking.paymentStatus === "refunded" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700")}>{booking.paymentStatus}</span></td>
                      <td className="px-5 py-5"><span className={"mb-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase " + badge[booking.status]}>{booking.status}</span><select value={booking.status} disabled={updatingBooking === booking.id} onChange={(e) => updateStatus(booking.id, e.target.value)} className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 disabled:opacity-50">{["pending", "accepted", "completed", "cancelled"].map((value) => <option key={value} value={value}>{value}</option>)}</select></td>
                    </tr>
                  ))}
                  {!loading && bookings.length === 0 && <tr><td colSpan="6" className="px-5 py-16 text-center"><p className="font-semibold text-slate-700">No bookings found</p><p className="mt-1 text-sm text-slate-400">Try changing or resetting your filters.</p></td></tr>}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">Rows per page <select value={filters.limit} onChange={(e) => changeFilter("limit", Number(e.target.value))} className="rounded-lg border border-slate-200 px-2 py-1.5">{[5, 10, 20, 50].map((n) => <option key={n}>{n}</option>)}</select></div>
              <div className="flex items-center gap-3"><button disabled={pagination.page <= 1} onClick={() => changeFilter("page", pagination.page - 1)} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</span><button disabled={pagination.page >= pagination.pages} onClick={() => changeFilter("page", pagination.page + 1)} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div>
            </div>
          </section>
        ) : (
          <section className="mt-7 grid gap-7 lg:grid-cols-[.72fr_1.28fr]">
            <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{editingCar ? "Edit vehicle" : "Fleet growth"}</p><h2 className="mt-2 text-2xl font-bold">{editingCar ? "Update car" : "Add a new car"}</h2><p className="mt-2 text-sm text-slate-500">Set the vehicle details and its per-kilometer rate.</p>
              <form onSubmit={saveCar} className="mt-6 space-y-4">
                <label className="block"><span className="mb-2 block text-sm font-semibold">Car name</span><input name="name" value={carForm.name} onChange={(e) => setCarForm({ ...carForm, name: e.target.value })} placeholder="e.g. Toyota Camry" className={inputClass} required /></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold">Vehicle type</span><input name="type" value={carForm.type} onChange={(e) => setCarForm({ ...carForm, type: e.target.value })} placeholder="e.g. Sedan" className={inputClass} required /></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold">Price per kilometer</span><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span><input name="pricePerKm" type="number" min="0.01" step="0.01" value={carForm.pricePerKm} onChange={(e) => setCarForm({ ...carForm, pricePerKm: e.target.value })} placeholder="0.00" className={inputClass + " pl-8"} required /></div></label>
                <button disabled={savingCar} className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 disabled:opacity-60">{savingCar ? "Saving..." : editingCar ? "Save changes" : "Add to fleet"}</button>
                {editingCar && <button type="button" onClick={() => { setEditingCar(null); setCarForm(emptyCar); }} className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold">Cancel editing</button>}
              </form>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.06)]">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">Fleet inventory</h2><p className="mt-1 text-sm text-slate-500">{visibleCars.length} vehicles</p></div><input value={carSearch} onChange={(e) => setCarSearch(e.target.value)} placeholder="Search fleet..." className={inputClass + " sm:max-w-xs"} /></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Rate</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleCars.map((car) => <tr key={car.id} className="hover:bg-slate-50"><td className="px-6 py-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-xs font-black text-white">CB</span><div><p className="font-bold">{car.name}</p><p className="text-xs text-slate-400">ID #{car.id}</p></div></div></td><td className="px-6 py-5 text-sm text-slate-600">{car.type}</td><td className="px-6 py-5 font-bold">{"$" + Number(car.pricePerKm).toFixed(2)}<span className="text-xs font-normal text-slate-400"> / km</span></td><td className="px-6 py-5 text-right"><button onClick={() => startEdit(car)} className="mr-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">Edit</button><button onClick={() => deleteCar(car)} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">Delete</button></td></tr>)}</tbody></table></div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;
