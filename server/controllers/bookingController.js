const { Op } = require("sequelize");
const { Booking, Car, User } = require("../models");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const BOOKING_STATUSES = ["pending", "accepted", "completed", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];
const SORT_FIELDS = ["createdAt", "travelDate", "totalPrice", "status"];

const createBooking = async (req, res) => {
  try {
    const { carId, pickupAddress, pickupLat, pickupLng, dropAddress, dropLat, dropLng, distanceKm, travelDate, travelTime } = req.body;
    const car = await Car.findByPk(carId);
    if (!car) return res.status(404).json({ message: "Car not found" });
    if (!pickupAddress || !dropAddress || !travelDate || !travelTime || Number(distanceKm) <= 0) {
      return res.status(400).json({ message: "Complete route, distance, date, and time are required" });
    }

    const booking = await Booking.create({
      UserId: req.user.id, CarId: carId, pickupAddress, dropAddress,
      distanceKm: Number(distanceKm), totalPrice: Number(distanceKm) * Number(car.pricePerKm),
      status: "pending", pickupLat, pickupLng, dropLat, dropLng, travelDate, travelTime,
    });
    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Create booking error", error: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { UserId: req.user.id }, include: [Car], order: [["createdAt", "DESC"]],
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Get my bookings error", error: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const {
      search = "", status = "", paymentStatus = "", carId = "",
      dateFrom = "", dateTo = "", page = "1", limit = "10",
      sortBy = "createdAt", sortOrder = "DESC",
    } = req.query;

    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
    const safeSort = SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";
    const safeOrder = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const bookingWhere = {};

    if (status) {
      if (!BOOKING_STATUSES.includes(status)) return res.status(400).json({ message: "Invalid booking status filter" });
      bookingWhere.status = status;
    }
    if (paymentStatus) {
      if (!PAYMENT_STATUSES.includes(paymentStatus)) return res.status(400).json({ message: "Invalid payment status filter" });
      bookingWhere.paymentStatus = paymentStatus;
    }
    if (carId) bookingWhere.CarId = Number(carId);
    if (dateFrom || dateTo) {
      bookingWhere.travelDate = {};
      if (dateFrom) bookingWhere.travelDate[Op.gte] = dateFrom;
      if (dateTo) bookingWhere.travelDate[Op.lte] = dateTo;
    }

    const term = String(search).trim();
    if (term) {
      const like = "%" + term + "%";
      bookingWhere[Op.or] = [
        { pickupAddress: { [Op.like]: like } },
        { dropAddress: { [Op.like]: like } },
        { "$User.name$": { [Op.like]: like } },
        { "$User.email$": { [Op.like]: like } },
        { "$Car.name$": { [Op.like]: like } },
      ];
      if (/^\d+$/.test(term)) bookingWhere[Op.or].push({ id: Number(term) });
    }

    const [{ count, rows }, total, pending, accepted, completed, cancelled, revenue] = await Promise.all([
      Booking.findAndCountAll({
        where: bookingWhere,
        include: [
          { model: Car, attributes: ["id", "name", "type", "pricePerKm"] },
          { model: User, attributes: ["id", "name", "email"] },
        ],
        distinct: true,
        subQuery: false,
        order: [[safeSort, safeOrder]],
        limit: safeLimit,
        offset: (safePage - 1) * safeLimit,
      }),
      Booking.count(),
      Booking.count({ where: { status: "pending" } }),
      Booking.count({ where: { status: "accepted" } }),
      Booking.count({ where: { status: "completed" } }),
      Booking.count({ where: { status: "cancelled" } }),
      Booking.sum("totalPrice", { where: { paymentStatus: "paid" } }),
    ]);

    res.json({
      bookings: rows,
      pagination: { page: safePage, limit: safeLimit, total: count, pages: Math.max(1, Math.ceil(count / safeLimit)) },
      summary: { total, pending, accepted, completed, cancelled, revenue: Number(revenue || 0) },
    });
  } catch (error) {
    res.status(500).json({ message: "Get all bookings error", error: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!BOOKING_STATUSES.includes(status)) return res.status(400).json({ message: "Invalid booking status" });

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (status === "cancelled" && booking.paymentStatus === "paid" && booking.stripePaymentIntentId) {
      await stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId });
      booking.paymentStatus = "refunded";
    }
    booking.status = status;
    await booking.save();
    res.json({ message: "Booking status updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Update booking error", error: error.message });
  }
};

const cancelMyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Booking already cancelled" });

    if (booking.paymentStatus === "paid" && booking.stripePaymentIntentId) {
      await stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId });
      booking.paymentStatus = "refunded";
    }
    booking.status = "cancelled";
    await booking.save();
    res.json({ message: booking.paymentStatus === "refunded" ? "Booking cancelled and refunded" : "Booking cancelled successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Cancel booking error", error: error.message });
  }
};

module.exports = { createBooking, getMyBookings, getAllBookings, updateBookingStatus, cancelMyBooking };
