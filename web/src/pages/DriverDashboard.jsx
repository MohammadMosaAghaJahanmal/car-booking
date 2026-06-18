import { useEffect, useRef, useState } from "react";
import API from "../api/axios";
import { getSocket } from "../socket";

function DriverDashboard() {
  const [rides, setRides] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const watchRef = useRef(null);
  const activeRef = useRef(null);

  const loadRides = async () => {
    try {
      const res = await API.get("/tracking/driver/rides");
      setRides(res.data);
    } catch (error) { setMessage(error.response?.data?.message || "Could not load rides."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // Initial remote data load; state updates occur after the API promise resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRides();
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (activeRef.current) getSocket().emit("stop-sharing", activeRef.current);
    };
  }, []);

  const startSharing = async (bookingId) => {
    if (!navigator.geolocation) return setMessage("This browser does not support location sharing.");
    try {
      await API.post("/tracking/" + bookingId + "/claim");
      const socket = getSocket();
      socket.emit("join-booking", bookingId);
      activeRef.current = bookingId;
      setActiveId(bookingId);
      setMessage("Waiting for your first GPS update...");
      watchRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const update = {
            bookingId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          };
          setLocation(update);
          setMessage("Location is live.");
          socket.emit("driver-location", update, (result) => {
            if (!result?.ok) setMessage(result?.message || "Location update failed.");
          });
        },
        (error) => setMessage(error.message || "Location permission was not granted."),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
      );
      await loadRides();
    } catch (error) { setMessage(error.response?.data?.message || "Could not start sharing."); }
  };

  const stopSharing = async () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    getSocket().emit("stop-sharing", activeId);
    await API.put("/tracking/" + activeId + "/stop");
    watchRef.current = null;
    activeRef.current = null;
    setActiveId(null);
    setLocation(null);
    setMessage("Location sharing stopped.");
    await loadRides();
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] pb-16">
      <section className="bg-slate-950 px-5 pb-24 pt-14 text-white">
        <div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">Driver workspace</p><h1 className="mt-3 text-4xl font-bold">Live ride console</h1><p className="mt-3 text-slate-400">Claim an accepted ride and securely share your GPS position with its passenger.</p></div>
      </section>
      <div className="relative mx-auto -mt-14 max-w-6xl px-5">
        <div className={"mb-6 rounded-2xl border p-5 shadow-sm " + (activeId ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sharing status</p><p className={"mt-1 text-lg font-bold " + (activeId ? "text-emerald-700" : "text-slate-800")}>{activeId ? "Live for booking #" + activeId : "Not sharing"}</p><p className="mt-1 text-sm text-slate-500">{message || "Choose a ride below when you are ready."}</p></div>{activeId && <button onClick={stopSharing} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white">Stop sharing</button>}</div>
          {location && <div className="mt-4 grid grid-cols-3 gap-3 border-t border-emerald-200 pt-4 text-sm"><div><p className="text-slate-400">Latitude</p><p className="font-semibold">{location.latitude.toFixed(6)}</p></div><div><p className="text-slate-400">Longitude</p><p className="font-semibold">{location.longitude.toFixed(6)}</p></div><div><p className="text-slate-400">Accuracy</p><p className="font-semibold">{Math.round(location.accuracy)} m</p></div></div>}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {loading ? <div className="h-56 animate-pulse rounded-2xl bg-white" /> : rides.map((ride) => {
            const assignedToMe = ride.RideTracking?.DriverId;
            return <article key={ride.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.06)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Booking #{ride.id}</p><h2 className="mt-2 text-xl font-bold">{ride.Car?.name}</h2><p className="text-sm text-slate-500">{ride.Car?.type}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Accepted</span></div><div className="mt-5 space-y-3 border-y border-slate-100 py-5 text-sm"><p><span className="font-semibold text-slate-400">Passenger:</span> {ride.User?.name}</p><p><span className="font-semibold text-slate-400">Pickup:</span> {ride.pickupAddress}</p><p><span className="font-semibold text-slate-400">Drop:</span> {ride.dropAddress}</p><p><span className="font-semibold text-slate-400">Schedule:</span> {ride.travelDate} at {ride.travelTime}</p></div><button disabled={activeId && activeId !== ride.id} onClick={() => activeId === ride.id ? null : startSharing(ride.id)} className="mt-5 w-full rounded-xl bg-slate-950 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{activeId === ride.id ? "Sharing this ride live" : assignedToMe ? "Resume live sharing" : "Claim and share location"}</button></article>;
          })}
          {!loading && rides.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><h2 className="font-bold">No accepted rides available</h2><p className="mt-2 text-sm text-slate-500">Accepted bookings will appear here.</p></div>}
        </div>
      </div>
    </main>
  );
}
export default DriverDashboard;