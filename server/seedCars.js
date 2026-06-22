const sequelize = require("./config/db");
const { Car } = require("./models");

const seedCars = async () => {
  try {
    await sequelize.authenticate();

    await Car.bulkCreate([
      {
        name: "Toyota Corolla",
        type: "Economy",
        pricePerKm: 2,
      },
      {
        name: "Toyota Camry",
        type: "Comfort",
        pricePerKm: 3,
      },
      {
        name: "Toyota Sienna",
        type: "Van",
        pricePerKm: 4,
      },
    ]);

    console.log("Cars added successfully");
    process.exit();
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedCars();