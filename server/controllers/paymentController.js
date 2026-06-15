const Stripe = require("stripe");
const { Booking } = require("../models");
const { notifyUser } = require("../services/notificationService");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.UserId !== req.user.id) {
      return res.status(403).json({ message: "Not your booking" });
    }

    const amount = Math.round(Number(booking.totalPrice) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "cad",
      metadata: {
        bookingId: booking.id,
        userId: req.user.id,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({
      message: "Payment intent error",
      error: error.message,
    });
  }
};

const refundPayment = async (paymentIntentId) => {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
};

const markBookingPaid = async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.UserId !== req.user.id) {
      return res.status(403).json({ message: "Not your booking" });
    }

    booking.paymentStatus = "paid";
    booking.stripePaymentIntentId = paymentIntentId;
    await booking.save();
    await notifyUser({ userId: booking.UserId, type: "payment", title: "Payment successful", message: "Payment for booking #" + booking.id + " was completed.", link: "/my-bookings", metadata: { bookingId: booking.id }, io: req.app.get("io") });

    res.json({
      message: "Booking marked as paid",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Mark paid error",
      error: error.message,
    });
  }
};

module.exports = { createPaymentIntent, markBookingPaid, refundPayment };