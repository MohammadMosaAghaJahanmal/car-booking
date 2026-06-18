const bcrypt = require("bcryptjs");
require("dotenv").config();
const sequelize = require("./config/db");
const { User } = require("./models");
(async () => {
  try {
    await sequelize.authenticate();
    const email = process.env.DRIVER_EMAIL || "driver@test.com";
    const password = process.env.DRIVER_PASSWORD || "driver123";
    const [driver, created] = await User.findOrCreate({
      where: { email },
      defaults: { name: process.env.DRIVER_NAME || "Demo Driver", email, password: await bcrypt.hash(password, 10), role: "driver" },
    });
    if (!created) await driver.update({ role: "driver" });
    console.log("Driver account ready:", email);
  } catch (error) {
    console.error("Driver seed failed:", error.message);
    process.exitCode = 1;
  } finally { await sequelize.close(); }
})();
