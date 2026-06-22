const express = require("express");
const {
  createPaymentIntent,
  markBookingPaid,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-payment-intent", protect, createPaymentIntent);
router.post("/mark-paid", protect, markBookingPaid);

module.exports = router;