import { useEffect, useState } from "react";
import API from "../api/axios";
import BookingMap from "../components/BookingMap";
import PlaceInput from "../components/PlaceInput";
import { bookingSchema } from "../validation/schemas";
import fallbackCarImage from "../assets/hero.png";
import defaultHeroImage from "../assets/booking-hero-banner.png";
import { useNavigate } from "react-router-dom";
function Home() {
  const [selecting, setSelecting] = useState("pickup");
  const navigate = useNavigate()
  const initState = {
  carId: "",
  pickupAddress: "",
  pickupLat: "",
  pickupLng: "",
  dropAddress: "",
  dropLat: "",
  dropLng: "",
  distanceKm: "",
  travelDate: "",
  travelTime: "",
}

const [form, setForm] = useState({...initState});
  const [cars, setCars] = useState([]);
  const [heroImage, setHeroImage] = useState(defaultHeroImage);


  const getCars = async () => {
    const res = await API.get("/cars");
    setCars(res.data);
  };

  const getHeroSettings = async () => {
    const response = await API.get("/settings/home", { params: { timestamp: Date.now() } });
    setHeroImage(response.data.heroImageUrl || defaultHeroImage);
  };

  useEffect(() => {
    // Initial remote homepage data load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getCars();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getHeroSettings();

    const refreshHero = () => getHeroSettings();
    window.addEventListener("focus", refreshHero);
    window.addEventListener("storage", refreshHero);
    window.addEventListener("hero-banner-updated", refreshHero);
    return () => {
      window.removeEventListener("focus", refreshHero);
      window.removeEventListener("storage", refreshHero);
      window.removeEventListener("hero-banner-updated", refreshHero);
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createBooking = async (e) => {
    e.preventDefault();

    const validation = bookingSchema.safeParse(form);
    if (!validation.success) {
      alert(validation.error.issues[0].message);
      return;
    }
    const token = localStorage.getItem("token");
    if(!token) return navigate('/login');

    await API.post("/bookings", {
      carId: form.carId,
      pickupAddress: form.pickupAddress,
      pickupLat: form.pickupLat,
      pickupLng: form.pickupLng,
      dropAddress: form.dropAddress,
      dropLat: form.dropLat,
      dropLng: form.dropLng,
      distanceKm: Number(form.distanceKm),
      travelDate: form.travelDate,
      travelTime: form.travelTime,
    });

    setForm({...initState})
    alert("Booking created successfully");
  };

  const { pickupLat, pickupLng, dropLat, dropLng } = form;

  useEffect(() => {
    if (!pickupLat || !pickupLng || !dropLat || !dropLng) return;

    const dLat = ((Number(dropLat) - Number(pickupLat)) * Math.PI) / 180;
    const dLng = ((Number(dropLng) - Number(pickupLng)) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(Number(pickupLat) * Math.PI / 180) *
      Math.cos(Number(dropLat) * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance is derived whenever either route endpoint changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((current) => ({ ...current, distanceKm: distance.toFixed(2) }));
  }, [pickupLat, pickupLng, dropLat, dropLng]);

  const selectedCar = cars.find((car) => car.id === Number(form.carId));

  const totalPrice =
    selectedCar && form.distanceKm
      ? Number(selectedCar.pricePerKm) * Number(form.distanceKm)
      : 0;


  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setForm((prev) => ({
          ...prev,
          pickupLat: lat,
          pickupLng: lng,
          pickupAddress: `Current Location (${lat}, ${lng})`,
        }));
      },
      (error) => {
        alert("Unable to get location");
        console.log(error);
      }
    );
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] pb-20">
      <section className="relative isolate min-h-[660px] overflow-hidden bg-slate-950 text-white">
        <img src={heroImage} onError={() => setHeroImage(defaultHeroImage)} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />
        <div className="relative mx-auto flex min-h-[660px] max-w-7xl items-center px-6 py-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-200 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.9)]" /> Premium rides, ready now
            </div>
            <h1 className="text-5xl font-black leading-[1.03] tracking-[-0.045em] sm:text-6xl lg:text-7xl">The city is yours.<br /><span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Ride beautifully.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">Choose a car you love, see the fare instantly, and follow every kilometer with live ride tracking.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#book-ride" className="rounded-2xl bg-blue-600 px-7 py-4 text-sm font-bold shadow-2xl shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-500">Book your ride</a>
              <a href="#fleet" className="rounded-2xl border border-white/15 bg-white/10 px-7 py-4 text-sm font-bold backdrop-blur-md transition hover:bg-white/15">Explore the fleet</a>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 divide-x divide-white/15 rounded-2xl border border-white/10 bg-slate-950/35 p-4 backdrop-blur-md">
              {[["24/7", "Always available"], ["Live", "Ride tracking"], ["Upfront", "Clear pricing"]].map(([value, label]) => <div key={label} className="px-4 first:pl-1"><p className="text-xl font-black">{value}</p><p className="mt-1 text-[11px] text-slate-400">{label}</p></div>)}
            </div>
          </div>
        </div>
      </section>
      <div id="book-ride" className="relative z-10 mx-auto -mt-16 max-w-6xl px-5">
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.08fr_.92fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.09)]">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Book Your Car</h1>
          <p className="text-gray-500 mb-6">
            Choose your car, set your route, and reserve in minutes.
          </p>

          <form onSubmit={createBooking} className="space-y-4">
            <select
              name="carId"
              value={form.carId}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              required
            >
              <option value="">Select Car</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name} - {car.type} - ${car.pricePerKm}/km
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={getCurrentLocation}
              className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
            >
              Use Current Location
            </button>

            <PlaceInput
              label="Search pickup location"
              name="pickupAddress"
              latName="pickupLat"
              lngName="pickupLng"
              form={form}
              setForm={setForm}
              required={true}
            />

            <PlaceInput
              label="Search drop location"
              name="dropAddress"
              latName="dropLat"
              lngName="dropLng"
              form={form}
              setForm={setForm}
              required={true}
            />

            <input
              name="distanceKm"
              placeholder="Distance KM"
              type="number"
              value={form.distanceKm}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3.5 font-semibold text-slate-600 outline-none"
              required
            />
            <input
              name="travelDate"
              type="date"
              value={form.travelDate}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              required
            />

            <input
              name="travelTime"
              type="time"
              value={form.travelTime}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              required
            />
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-gray-500">Estimated Price</p>
              <h2 className="text-2xl font-bold">
                ${totalPrice.toFixed(2)}
              </h2>
            </div>
            <button className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              Book Now
            </button>
          </form>
        </div>

        <div id="fleet" className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Available Cars</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {cars.map((car) => {
              const active = Number(form.carId) === car.id;
              return (
                <button
                  type="button"
                  key={car.id}
                  onClick={() => setForm((current) => ({ ...current, carId: String(car.id) }))}
                  className={"group overflow-hidden rounded-2xl border text-left transition " + (active ? "border-blue-400 bg-blue-500/10 ring-2 ring-blue-500/20" : "border-white/10 bg-white/5 hover:-translate-y-1 hover:bg-white/10")}
                >
                  <div className="relative h-36 overflow-hidden bg-slate-800">
                    <img src={car.imageUrl || fallbackCarImage} onError={(event) => { event.currentTarget.src = fallbackCarImage; }} alt={car.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    {active && <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">Selected</span>}
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div><h3 className="font-bold text-white">{car.name}</h3><p className="mt-1 text-sm text-slate-400">{car.type}</p></div>
                    <div className="text-right"><p className="text-xl font-bold text-white">{"$" + car.pricePerKm}</p><p className="text-xs text-slate-400">per km</p></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.07)]"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Interactive route</p><h2 className="mt-1 text-2xl font-bold">Choose points on the map</h2></div><div className="mb-4 flex w-fit rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setSelecting("pickup")}
          className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
        >
          Select Pickup
        </button>

        <button
          type="button"
          onClick={() => setSelecting("drop")}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
        >
          Select Drop
        </button>
      </div>
      <BookingMap form={form} setForm={setForm} selecting={selecting} />
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        Pickup and destination automatically update the driving route, distance, and estimated price.
      </div>
    </div>
    </div>
  </main>
  );
}

export default Home;