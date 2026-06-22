const bcrypt = require("bcryptjs");
const sequelize = require("./config/db");
const { User } = require("./models");

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully");
    process.exit();
  } catch (error) {
    console.error("Admin seed error:", error.message);
    process.exit(1);
  }
};

seedAdmin();