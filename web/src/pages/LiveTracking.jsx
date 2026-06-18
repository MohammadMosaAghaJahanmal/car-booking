import { useEffect, useState } from "react";
import { Map, Marker } from "@vis.gl/react-google-maps";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios";
import { getSocket } from "../socket";

function LiveTracking() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket;
    const load = async () => {
      try {
        const res = await API.get("/tracking/" + bookingId);
        setBooking(res.data.booking);
        setTracking(res.data.tracking);
        setConnected(Boolean(res.data.tracking?.isSharing));
        socket = getSocket();
        socket.emit("join-booking", bookingId, (result) => {
          if (!result?.ok) setError(result?.message || "Could not join live tracking.");
        });
        socket.on("driver-location", (update) => {
          if (String(update.bookingId) === String(bookingId)) { setTracking(update); setConnected(true); }
        });
        socket.on("driver-offline", (update) => {
          if (String(update.bookingId) === String(bookingId)) setConnected(false);
        });
      } catch (err) { setError(err.response?.data?.message || "Could not load this ride."); }
    };
    load();
    return () => {
      if (socket) { socket.off("driver-location"); socket.off("driver-offline"); }
    };
  }, [bookingId]);

  const center = tracking?.latitude != null ? { lat: Number(tracking.latitude), lng: Number(tracking.longitude) } :
    booking?.pickupLat ? { lat: Number(booking.pickupLat), lng: Number(booking.pickupLng) } : { lat: 34.5553, lng: 69.2075 };

  return (
    <main className="min-h-screen bg-[#f5f7fb] pb-16">
      <section className="bg-slate-950 px-5 pb-24 pt-12 text-white"><div className="mx-auto max-w-6xl"><Link to="/my-bookings" className="text-sm font-semibold text-blue-400">&larr; My bookings</Link><div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">Booking #{bookingId}</p><h1 className="mt-2 text-4xl font-bold">Track your driver</h1></div><span className={"w-fit rounded-full px-4 py-2 text-sm font-bold " + (connected ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-slate-300")}><span className={"mr-2 inline-block h-2 w-2 rounded-full " + (connected ? "animate-pulse bg-emerald-400" : "bg-slate-500")} />{connected ? "Driver is live" : "Waiting for driver"}</span></div></div></section>
      <div className="relative mx-auto -mt-14 max-w-6xl px-5">
        {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,.1)]"><div className="h-[520px] overflow-hidden rounded-2xl"><Map center={center} zoom={tracking?.latitude != null ? 15 : 12}>{tracking?.latitude != null && <Marker position={center} title="Driver location" />}</Map></div><div className="grid gap-4 p-4 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase text-slate-400">Driver</p><p className="mt-1 font-semibold">{booking?.RideTracking?.Driver?.name || "Not assigned yet"}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Last update</p><p className="mt-1 font-semibold">{tracking?.lastSeen ? new Date(tracking.lastSeen).toLocaleTimeString() : "No location yet"}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Accuracy</p><p className="mt-1 font-semibold">{tracking?.accuracy ? Math.round(tracking.accuracy) + " meters" : "Unavailable"}</p></div></div></div>
      </div>
    </main>
  );
}
export default LiveTracking;