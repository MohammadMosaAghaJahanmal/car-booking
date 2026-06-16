import { useEffect, useState } from "react";
import API from "../api/axios";
import BookingMap from "../components/BookingMap";
import PlaceInput from "../components/PlaceInput";
import { bookingSchema } from "../validation/schemas";
import fallbackCarImage from "../assets/hero.png";
function Home() {
  const [selecting, setSelecting] = useState("pickup");

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


  const getCars = async () => {
    const res = await API.get("/cars");
    setCars(res.data);
  };

  useEffect(() => {
    // Initial remote fleet load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getCars();
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
    <main className="min-h-screen bg-[#f5f7fb] pb-16"><section className="relative overflow-hidden bg-slate-950 px-6 pb-28 pt-20 text-white"><div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"></div><div className="relative mx-auto max-w-6xl"><p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-blue-400">Premium rides, simple booking</p><h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">Your next ride, <span className="text-blue-400">beautifully simple.</span></h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">Choose your car, plan the route, and know the price before you book.</p><div className="mt-7 flex flex-wrap gap-6 text-sm text-slate-300"><span>+ Upfront pricing</span><span>+ Secure payments</span><span>+ Easy cancellation</span></div></div></section><div className="relative mx-auto -mt-16 max-w-6xl px-5">
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

        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
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