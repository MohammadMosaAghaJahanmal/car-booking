const { Op } = require("sequelize");
const { Car, Booking } = require("../models");

const validateCar = ({ name, type, pricePerKm }, partial = false) => {
  if (!partial && (!name || !type || pricePerKm === undefined)) return "Name, type, and price per km are required";
  if (name !== undefined && !String(name).trim()) return "Car name cannot be empty";
  if (type !== undefined && !String(type).trim()) return "Car type cannot be empty";
  if (pricePerKm !== undefined && (!Number.isFinite(Number(pricePerKm)) || Number(pricePerKm) <= 0)) return "Price per km must be greater than zero";
  return null;
};

const createCar = async (req, res) => {
  try {
    const validationError = validateCar(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    const car = await Car.create({
      name: String(req.body.name).trim(),
      type: String(req.body.type).trim(),
      pricePerKm: Number(req.body.pricePerKm),
    });
    res.status(201).json({ message: "Car created successfully", car });
  } catch (error) {
    res.status(500).json({ message: "Create car error", error: error.message });
  }
};

const getCars = async (req, res) => {
  try {
    const { search = "", type = "", sortBy = "name", sortOrder = "ASC" } = req.query;
    const where = {};
    const term = String(search).trim();
    if (term) {
      const like = "%" + term + "%";
      where[Op.or] = [{ name: { [Op.like]: like } }, { type: { [Op.like]: like } }];
    }
    if (type) where.type = type;
    const safeSort = ["name", "type", "pricePerKm", "createdAt"].includes(sortBy) ? sortBy : "name";
    const safeOrder = String(sortOrder).toUpperCase() === "DESC" ? "DESC" : "ASC";
    const cars = await Car.findAll({ where, order: [[safeSort, safeOrder]] });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: "Get cars error", error: error.message });
  }
};

const updateCar = async (req, res) => {
  try {
    const validationError = validateCar(req.body, true);
    if (validationError) return res.status(400).json({ message: validationError });
    const car = await Car.findByPk(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (req.body.name !== undefined) car.name = String(req.body.name).trim();
    if (req.body.type !== undefined) car.type = String(req.body.type).trim();
    if (req.body.pricePerKm !== undefined) car.pricePerKm = Number(req.body.pricePerKm);
    await car.save();
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
