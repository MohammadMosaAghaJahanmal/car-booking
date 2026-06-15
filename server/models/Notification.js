const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
module.exports = sequelize.define("Notification", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "info" },
  title: { type: DataTypes.STRING(120), allowNull: false },
  message: { type: DataTypes.STRING(500), allowNull: false },
  link: { type: DataTypes.STRING(255), allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
  readAt: { type: DataTypes.DATE, allowNull: true },
});