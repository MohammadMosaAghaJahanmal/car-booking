import { useEffect, useState } from "react";
import API from "../api/axios";
import { Link } from "react-router-dom";

function MyBookings() {
  const [bookings, setBookings] = useState([]);

  const getMyBookings = async () => {
    const res = await API.get("/bookings/my-bookings");
    setBookings(res.data);
  };

  const cancelBooking = async (id) => {
    await API.put(`/bookings/${id}/cancel`);
    getMyBookings();
  };

  useEffect(() => {
    getMyBookings();
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl shadow p-6">
              <p>
                <b>Payment:</b>{" "}
                <span className={
                  booking.paymentStatus === "paid"
                    ? "text-green-600"
                    : booking.paymentStatus === "refunded"
                    ? "text-orange-500"
                    : "text-red-500"
                }>
                  {booking.paymentStatus}
                </span>
              </p>
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold">{booking.Car?.name}</h2>
                  <p className="text-gray-500">{booking.Car?.type}</p>
                </div>

                <span className="bg-slate-100 px-4 py-2 rounded-lg font-semibold">
                  {booking.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><b>From:</b> {booking.pickupAddress}</p>
                <p><b>To:</b> {booking.dropAddress}</p>
                <p><b>Distance:</b> {booking.distanceKm} km</p>
                <p><b>Date:</b> {booking.travelDate}</p>
                <p><b>Time:</b> {booking.travelTime}</p>
                <p><b>Total:</b> ${booking.totalPrice}</p>
              </div>
              {booking.status === "pending" && (
                <button
                  onClick={() => cancelBooking(booking.id)}
                  className="mt-5 bg-red-500 text-white px-5 py-2 rounded-lg"
                >
                  Cancel Booking
                </button>
              )}
              {booking.paymentStatus !== "paid" && (
                <Link
                  to={`/payment/${booking.id}`}
                  className="mt-5 inline-block bg-green-600 text-white px-5 py-2 rounded-lg"
                >
                  Pay Now
                </Link>
              )}
            </div>
          ))}

          {bookings.length === 0 && (
            <p className="text-gray-500">No bookings found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;