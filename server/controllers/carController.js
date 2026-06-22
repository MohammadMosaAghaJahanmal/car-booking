const { Car } = require("../models");

const createCar = async (req, res) => {
  try {
    const { name, type, pricePerKm } = req.body;

    const car = await Car.create({
      name,
      type,
      pricePerKm,
    });

    res.status(201).json({
      message: "Car created successfully",
      car,
    });
  } catch (error) {
    res.status(500).json({ message: "Create car error", error: error.message });
  }
};

const getCars = async (req, res) => {
  try {
    const cars = await Car.findAll();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: "Get cars error", error: error.message });
  }
};

const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, pricePerKm } = req.body;

    const car = await Car.findByPk(id);

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    car.name = name || car.name;
    car.type = type || car.type;
    car.pricePerKm = pricePerKm || car.pricePerKm;

    await car.save();

    res.json({
      message: "Car updated successfully",
      car,
    });
  } catch (error) {
    res.status(500).json({ message: "Update car error", error: error.message });
  }
};

const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;

    const car = await Car.findByPk(id);

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    await car.destroy();

    res.json({ message: "Car deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete car error", error: error.message });
  }
};

module.exports = {
  createCar,
  getCars,
  updateCar,
  deleteCar,
};