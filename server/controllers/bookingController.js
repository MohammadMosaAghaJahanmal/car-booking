const { Op } = require("sequelize");
const { Booking, Car, User } = require("../models");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createBooking = async (req, res) => {
  try {
    const { carId, pickupAddress, pickupLat, pickupLng, dropAddress, dropLat, dropLng, distanceKm, travelDate, travelTime } = req.body;
    const car = await Car.findByPk(carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

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
    const { search, status, paymentStatus, carId, dateFrom, dateTo, sortBy, sortOrder } = req.validated.query;
    const where = { UserId: req.user.id };

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (carId) where.CarId = carId;
    if (dateFrom || dateTo) {
      where.travelDate = {};
      if (dateFrom) where.travelDate[Op.gte] = dateFrom;
      if (dateTo) where.travelDate[Op.lte] = dateTo;
    }
    if (search) {
      const like = "%" + search + "%";
      where[Op.or] = [
        { pickupAddress: { [Op.like]: like } },
        { dropAddress: { [Op.like]: like } },
        { "$Car.name$": { [Op.like]: like } },
      ];
      if (/^\d+$/.test(search)) where[Op.or].push({ id: Number(search) });
    }

    const bookings = await Booking.findAll({
      where,
      include: [{ model: Car, attributes: ["id", "name", "type", "pricePerKm"] }],
      subQuery: false,
      order: [[sortBy, sortOrder.toUpperCase()]],
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
    } = req.validated.query;

    const safePage = page;
    const safeLimit = limit;
    const safeSort = sortBy;
    const safeOrder = sortOrder.toUpperCase();
    const bookingWhere = {};

    if (status) bookingWhere.status = status;
    if (paymentStatus) bookingWhere.paymentStatus = paymentStatus;
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
