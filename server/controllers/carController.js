const { Op } = require("sequelize");
const { Car, Booking } = require("../models");

const createCar = async (req, res) => {
  try {
    const car = await Car.create(req.body);
    res.status(201).json({ message: "Car created successfully", car });
  } catch (error) {
    res.status(500).json({ message: "Create car error", error: error.message });
  }
};

const getCars = async (req, res) => {
  try {
    const { search, type, sortBy, sortOrder } = req.validated.query;
    const where = {};
    if (search) {
      const like = "%" + search + "%";
      where[Op.or] = [{ name: { [Op.like]: like } }, { type: { [Op.like]: like } }];
    }
    if (type) where.type = type;
    const cars = await Car.findAll({ where, order: [[sortBy, sortOrder.toUpperCase()]] });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: "Get cars error", error: error.message });
  }
};

const updateCar = async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });
    await car.update(req.body);
    res.json({ message: "Car updated successfully", car });
  } catch (error) {
    res.status(500).json({ message: "Update car error", error: error.message });
  }
};

const deleteCar = async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });
    const bookingCount = await Booking.count({ where: { CarId: car.id } });
    if (bookingCount > 0) return res.status(409).json({ message: "This car has bookings and cannot be deleted" });
    await car.destroy();
    res.json({ message: "Car deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete car error", error: error.message });
  }
};

module.exports = { createCar, getCars, updateCar, deleteCar };
