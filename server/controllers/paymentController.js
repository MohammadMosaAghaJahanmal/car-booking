const Stripe = require("stripe");
const { Booking, Car } = require("../models");
const { notifyUser } = require("../services/notificationService");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const sendPaymentError = (res, error, fallback) => {
  console.error(fallback + ":", error.message);
  if (error.type?.startsWith("Stripe")) {
    return res.status(502).json({ message: "The payment service is temporarily unavailable. Please try again." });
  }
  return res.status(500).json({ message: fallback });
};

const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.validated.body;
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Car, attributes: ["id", "name", "type", "imageUrl"] }],
    });

    if (!booking) return res.status(404).json({ message: "We could not find this booking." });
    if (booking.UserId !== req.user.id) return res.status(403).json({ message: "You do not have access to this booking." });
    if (booking.status === "cancelled") return res.status(409).json({ message: "This booking was cancelled and cannot be paid." });
    if (booking.paymentStatus === "paid") return res.status(409).json({ message: "This booking has already been paid." });

    const amount = Math.round(Number(booking.totalPrice) * 100);
    if (!Number.isInteger(amount) || amount < 50) {
      return res.status(422).json({ message: "The booking total is too small or invalid for payment." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "cad",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { bookingId: String(booking.id), userId: String(req.user.id) },
      description: "Car booking #" + booking.id,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      booking: {
        id: booking.id,
        totalPrice: booking.totalPrice,
        distanceKm: booking.distanceKm,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        travelDate: booking.travelDate,
        travelTime: booking.travelTime,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        car: booking.Car,
      },
    });
  } catch (error) {
    return sendPaymentError(res, error, "We could not initialize your payment. Please try again.");
  }
};

const refundPayment = async (paymentIntentId) => stripe.refunds.create({ payment_intent: paymentIntentId });

const markBookingPaid = async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.validated.body;
    const booking = await Booking.findByPk(bookingId);

    if (!booking) return res.status(404).json({ message: "We could not find this booking." });
    if (booking.UserId !== req.user.id) return res.status(403).json({ message: "You do not have access to this booking." });
    if (booking.paymentStatus === "paid") return res.json({ message: "Payment was already confirmed.", booking });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const expectedAmount = Math.round(Number(booking.totalPrice) * 100);
    const belongsToBooking = paymentIntent.metadata?.bookingId === String(booking.id)
      && paymentIntent.metadata?.userId === String(req.user.id);

    if (paymentIntent.status !== "succeeded" || !belongsToBooking || paymentIntent.amount !== expectedAmount || paymentIntent.currency !== "cad") {
      return res.status(409).json({ message: "We could not verify this payment. No booking changes were made." });
    }

    booking.paymentStatus = "paid";
    booking.stripePaymentIntentId = paymentIntent.id;
    await booking.save();

    notifyUser({
      userId: booking.UserId,
      type: "payment",
      title: "Payment successful",
      message: "Payment for booking #" + booking.id + " was completed.",
      link: "/my-bookings",
      metadata: { bookingId: booking.id },
      io: req.app.get("io"),
    }).catch((error) => console.error("Payment notification error:", error.message));

    res.json({ message: "Payment confirmed successfully.", booking });
  } catch (error) {
    return sendPaymentError(res, error, "We could not confirm your payment. Please contact support if your card was charged.");
  }
};

module.exports = { createPaymentIntent, markBookingPaid, refundPayment };
