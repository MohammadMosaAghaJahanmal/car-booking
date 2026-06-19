const express = require("express");
const { createPaymentIntent, markBookingPaid } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { paymentIntentSchema, markPaidSchema } = require("../validation/schemas");

const router = express.Router();
router.post("/create-payment-intent", protect, validate(paymentIntentSchema), createPaymentIntent);
router.post("/mark-paid", protect, validate(markPaidSchema), markBookingPaid);

module.exports = router;
