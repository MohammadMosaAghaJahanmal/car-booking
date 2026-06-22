const express = require("express");
const {
  createCar,
  getCars,
  updateCar,
  deleteCar,
} = require("../controllers/carController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getCars);
router.post("/", protect, adminOnly, createCar);
router.put("/:id", protect, adminOnly, updateCar);
router.delete("/:id", protect, adminOnly, deleteCar);

module.exports = router;