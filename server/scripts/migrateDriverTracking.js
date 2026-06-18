require("dotenv").config();
const sequelize = require("../config/db");
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.query("ALTER TABLE Users MODIFY role ENUM('user','admin','driver') NOT NULL DEFAULT 'user'");
    require("../models");
    await sequelize.sync();
    console.log("Driver tracking migration completed.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally { await sequelize.close(); }
})();