const express = require("express");
const { createBooking, getMyBookings, getAllBookings, updateBookingStatus, cancelMyBooking } = require("../controllers/bookingController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { bookingSchema, bookingStatusSchema, bookingQuerySchema } = require("../validation/schemas");

const router = express.Router();
router.post("/", protect, validate(bookingSchema), createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.get("/all", protect, adminOnly, validate(bookingQuerySchema, "query"), getAllBookings);
router.put("/:id/status", protect, adminOnly, validate(bookingStatusSchema), updateBookingStatus);
router.put("/:id/cancel", protect, cancelMyBooking);

module.exports = router;
