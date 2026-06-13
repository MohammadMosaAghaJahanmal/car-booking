const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

module.exports = sequelize.define("SiteSetting", {
  key: { type: DataTypes.STRING(80), primaryKey: true },
  value: { type: DataTypes.TEXT, allowNull: true },
});
