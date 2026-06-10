const router = require("express").Router();
const { protect, driverOnly } = require("../middleware/authMiddleware");
const controller = require("../controllers/trackingController");
router.get("/driver/rides", protect, driverOnly, controller.driverRides);
router.post("/:bookingId/claim", protect, driverOnly, controller.claimRide);
router.put("/:bookingId/stop", protect, driverOnly, controller.stopSharing);
router.put("/:bookingId/complete", protect, driverOnly, controller.completeRide);
router.get("/:bookingId", protect, controller.getTracking);
module.exports = router;