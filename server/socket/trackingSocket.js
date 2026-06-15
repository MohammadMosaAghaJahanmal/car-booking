const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { User, Booking, RideTracking } = require("../models");
const locationSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().nullable().optional(),
  heading: z.number().min(0).max(360).nullable().optional(),
  speed: z.number().nonnegative().nullable().optional(),
});

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.user = await User.findByPk(decoded.id, { attributes: { exclude: ["password"] } });
      if (!socket.user) throw new Error();
      next();
    } catch { next(new Error("Invalid authentication")); }
  });

  io.on("connection", (socket) => {
    socket.join("user:" + socket.user.id);
    socket.on("join-booking", async (bookingId, ack = () => {}) => {
      const booking = await Booking.findByPk(bookingId, { include: [RideTracking] });
      if (!booking) return ack({ ok: false, message: "Booking not found" });
      const allowed = socket.user.role === "admin" || booking.UserId === socket.user.id || (socket.user.role === "driver" && booking.RideTracking?.DriverId === socket.user.id);
      if (!allowed) return ack({ ok: false, message: "Not authorized" });
      socket.join("booking:" + booking.id);
      ack({ ok: true, tracking: booking.RideTracking });
    });

    socket.on("driver-location", async (payload, ack = () => {}) => {
      if (socket.user.role !== "driver") return ack({ ok: false, message: "Driver only" });
      const parsed = locationSchema.safeParse(payload);
      if (!parsed.success) return ack({ ok: false, message: parsed.error.issues[0].message });
      const { bookingId, ...location } = parsed.data;
      const tracking = await RideTracking.findOne({ where: { BookingId: bookingId, DriverId: socket.user.id } });
      if (!tracking) return ack({ ok: false, message: "Claim this ride first" });
      await tracking.update({ ...location, isSharing: true, lastSeen: new Date() });
      socket.join("booking:" + bookingId);
      const update = { bookingId, ...location, isSharing: true, lastSeen: tracking.lastSeen };
      io.to("booking:" + bookingId).emit("driver-location", update);
      ack({ ok: true });
    });

    socket.on("stop-sharing", async (bookingId) => {
      if (socket.user.role !== "driver") return;
      const tracking = await RideTracking.findOne({ where: { BookingId: bookingId, DriverId: socket.user.id } });
      if (tracking) {
        await tracking.update({ isSharing: false });
        io.to("booking:" + bookingId).emit("driver-offline", { bookingId, lastSeen: tracking.lastSeen });
      }
    });

    socket.on("disconnect", async () => {
      if (socket.user?.role !== "driver") return;
      const active = await RideTracking.findAll({ where: { DriverId: socket.user.id, isSharing: true } });
      await Promise.all(active.map((item) => item.update({ isSharing: false })));
      active.forEach((item) => io.to("booking:" + item.BookingId).emit("driver-offline", { bookingId: item.BookingId, lastSeen: item.lastSeen }));
    });
  });
};