const express = require("express");
const { createCar, getCars, updateCar, deleteCar } = require("../controllers/carController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { carSchema, updateCarSchema, carQuerySchema } = require("../validation/schemas");

const router = express.Router();
router.get("/", validate(carQuerySchema, "query"), getCars);
router.post("/", protect, adminOnly, validate(carSchema), createCar);
router.put("/:id", protect, adminOnly, validate(updateCarSchema), updateCar);
router.delete("/:id", protect, adminOnly, deleteCar);

module.exports = router;
