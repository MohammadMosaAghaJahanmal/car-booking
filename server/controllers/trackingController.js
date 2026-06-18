const { Booking, Car, User, RideTracking } = require("../models");
const includes = [
  { model: Car, attributes: ["id", "name", "type"] },
  { model: User, attributes: ["id", "name", "email"] },
  { model: RideTracking, include: [{ model: User, as: "Driver", attributes: ["id", "name"] }] },
];

const driverRides = async (req, res) => {
  try {
    const rides = await Booking.findAll({ where: { status: "accepted" }, include: includes, order: [["travelDate", "ASC"], ["travelTime", "ASC"]] });
    res.json(rides.filter((ride) => !ride.RideTracking || ride.RideTracking.DriverId === req.user.id));
  } catch (error) { res.status(500).json({ message: "Could not load driver rides", error: error.message }); }
};

const claimRide = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "accepted") return res.status(409).json({ message: "Only accepted bookings can be claimed" });
    const [tracking, created] = await RideTracking.findOrCreate({ where: { BookingId: booking.id }, defaults: { BookingId: booking.id, DriverId: req.user.id } });
    if (!created && tracking.DriverId !== req.user.id) return res.status(409).json({ message: "Ride already assigned to another driver" });
    res.json({ message: "Ride assigned", tracking });
  } catch (error) { res.status(500).json({ message: "Could not claim ride", error: error.message }); }
};

const stopSharing = async (req, res) => {
  try {
    const tracking = await RideTracking.findOne({ where: { BookingId: req.params.bookingId, DriverId: req.user.id } });
    if (!tracking) return res.status(404).json({ message: "Tracking assignment not found" });
    await tracking.update({ isSharing: false });
    req.app.get("io").to("booking:" + req.params.bookingId).emit("driver-offline", { bookingId: Number(req.params.bookingId), lastSeen: tracking.lastSeen });
    res.json({ message: "Location sharing stopped" });
  } catch (error) { res.status(500).json({ message: "Could not stop sharing", error: error.message }); }
};

const getTracking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.bookingId, { include: includes });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const tracking = booking.RideTracking;
    const allowed = req.user.role === "admin" || booking.UserId === req.user.id || (req.user.role === "driver" && tracking?.DriverId === req.user.id);
    if (!allowed) return res.status(403).json({ message: "You cannot view this ride" });
    res.json({ booking, tracking });
  } catch (error) { res.status(500).json({ message: "Could not load tracking", error: error.message }); }
};
module.exports = { driverRides, claimRide, stopSharing, getTracking };