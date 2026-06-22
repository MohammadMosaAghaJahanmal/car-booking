import { useEffect, useState } from "react";
import API from "../api/axios";

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [carForm, setCarForm] = useState({
    name: "",
    type: "",
    pricePerKm: "",
  });

  const getAllBookings = async () => {
    const res = await API.get("/bookings/all");
    setBookings(res.data);
  };

  const updateStatus = async (id, status) => {
    await API.put(`/bookings/${id}/status`, { status });
    getAllBookings();
  };

  useEffect(() => {
    getAllBookings();
    getCars();
  }, []);

  const getCars = async () => {
    const res = await API.get("/cars");
    setCars(res.data);
  };

  const handleCarChange = (e) => {
    setCarForm({ ...carForm, [e.target.name]: e.target.value });
  };

  const createCar = async (e) => {
    e.preventDefault();

    await API.post("/cars", {
      name: carForm.name,
      type: carForm.type,
      pricePerKm: Number(carForm.pricePerKm),
    });

    setCarForm({ name: "", type: "", pricePerKm: "" });
    getCars();
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">Total Bookings</p>
            <h2 className="text-3xl font-bold">{bookings.length}</h2>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">Pending</p>
            <h2 className="text-3xl font-bold">
              {bookings.filter((b) => b.status === "pending").length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">Completed</p>
            <h2 className="text-3xl font-bold">
              {bookings.filter((b) => b.status === "completed").length}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add New Car</h2>

          <form onSubmit={createCar} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              name="name"
              value={carForm.name}
              onChange={handleCarChange}
              placeholder="Car name"
              className="border p-3 rounded-lg"
              required
            />

            <input
              name="type"
              value={carForm.type}
              onChange={handleCarChange}
              placeholder="Car type"
              className="border p-3 rounded-lg"
              required
            />

            <input
              name="pricePerKm"
              value={carForm.pricePerKm}
              onChange={handleCarChange}
              placeholder="Price per km"
              type="number"
              className="border p-3 rounded-lg"
              required
            />

            <button className="bg-slate-900 text-white rounded-lg">
              Add Car
            </button>
          </form>
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Cars</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cars.map((car) => (
                <div key={car.id} className="border rounded-xl p-4">
                  <h3 className="font-bold text-lg">{car.name}</h3>
                  <p className="text-gray-500">{car.type}</p>
                  <p className="font-semibold">${car.pricePerKm}/km</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold">All Bookings</h2>
          </div>

          {bookings.map((booking) => (
            <div key={booking.id} className="p-5 border-b">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">{booking.Car?.name}</h3>
                  <p className="text-gray-500">User ID: {booking.UserId}</p>
                  <p>From: {booking.pickupAddress}</p>
                  <p>To: {booking.dropAddress}</p>
                  <p>Total: ${booking.totalPrice}</p>
                  <p>Date: {booking.travelDate}</p>
                  <p>Time: {booking.travelTime}</p>
                </div>

                <div>
                  <p className="font-semibold mb-3">Status: {booking.status}</p>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(booking.id, "pending")}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                    >
                      Pending
                    </button>

                    <button
                      onClick={() => updateStatus(booking.id, "accepted")}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => updateStatus(booking.id, "completed")}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                      Complete
                    </button>

                    <button
                      onClick={() => updateStatus(booking.id, "cancelled")}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <p className="p-5 text-gray-500">No bookings found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;