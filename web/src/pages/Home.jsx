import { useEffect, useState } from "react";
import API from "../api/axios";
import BookingMap from "../components/BookingMap";
import PlaceInput from "../components/PlaceInput";
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
    getCars();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createBooking = async (e) => {
    e.preventDefault();

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

  const calculateDistance = () => {
  if (!form.pickupLat || !form.dropLat) {
    alert("Please select pickup and drop first");
    return;
  }

  const R = 6371;

  const dLat =
    ((Number(form.dropLat) - Number(form.pickupLat)) * Math.PI) / 180;

  const dLng =
    ((Number(form.dropLng) - Number(form.pickupLng)) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(form.pickupLat) * Math.PI) / 180) *
      Math.cos((Number(form.dropLat) * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  setForm((prev) => ({
    ...prev,
    distanceKm: distance.toFixed(2),
    }));
  };
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
    <div className="p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-3xl font-bold mb-2">Book Your Car</h1>
          <p className="text-gray-500 mb-6">
            Simple car booking system for learning.
          </p>

          <form onSubmit={createBooking} className="space-y-4">
            <select
              name="carId"
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
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
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
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
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />
            <input
              name="travelDate"
              type="date"
              value={form.travelDate}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />

            <input
              name="travelTime"
              type="time"
              value={form.travelTime}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-gray-500">Estimated Price</p>
              <h2 className="text-2xl font-bold">
                ${totalPrice.toFixed(2)}
              </h2>
            </div>
            <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold">
              Book Now
            </button>
          </form>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl shadow p-8">
          <h2 className="text-2xl font-bold mb-6">Available Cars</h2>

          <div className="space-y-4">
            {cars.map((car) => (
              <div
                key={car.id}
                className="bg-white/10 rounded-xl p-5 flex justify-between"
              >
                <div>
                  <h3 className="text-xl font-semibold">{car.name}</h3>
                  <p className="text-gray-300">{car.type}</p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">${car.pricePerKm}</p>
                  <p className="text-gray-300 text-sm">per km</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => setSelecting("pickup")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Select Pickup
        </button>

        <button
          type="button"
          onClick={() => setSelecting("drop")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Select Drop
        </button>
      </div>
      <BookingMap form={form} setForm={setForm} selecting={selecting} />
      <button
        type="button"
        onClick={calculateDistance}
        className="mt-4 bg-slate-900 text-white px-5 py-3 rounded-lg"
      >
        Calculate Distance
      </button>
    </div>
  );
}

export default Home;