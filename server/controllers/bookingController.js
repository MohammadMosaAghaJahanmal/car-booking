const { Booking, Car } = require("../models");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const createBooking = async (req, res) => {
  try {
    const {
      carId,
      pickupAddress,
      pickupLat,
      pickupLng,
      dropAddress,
      dropLat,
      dropLng,
      distanceKm,
      travelDate,
      travelTime,
    } = req.body;

    const car = await Car.findByPk(carId);

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    const totalPrice = distanceKm * car.pricePerKm;

    const booking = await Booking.create({
      UserId: req.user.id,
      CarId: carId,
      pickupAddress,
      dropAddress,
      distanceKm,
      totalPrice,
      status: "pending",
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      travelDate,
      travelTime,
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Create booking error", error: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { UserId: req.user.id },
      include: [Car],
      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Get my bookings error", error: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [Car],
      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Get all bookings error", error: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;
    await booking.save();

    res.json({
      message: "Booking status updated",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Update booking error", error: error.message });
  }
};
const cancelMyBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({
      where: {
        id,
        UserId: req.user.id,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    // Refund if paid
    if (
      booking.paymentStatus === "paid" &&
      booking.stripePaymentIntentId
    ) {
      await stripe.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
      });

      booking.paymentStatus = "refunded";
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({
      message:
        booking.paymentStatus === "refunded"
          ? "Booking cancelled and refunded"
          : "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Cancel booking error",
      error: error.message,
    });
  }
};
module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  cancelMyBooking,
};