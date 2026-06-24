const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

module.exports = sequelize.define("PasswordResetToken", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  usedAt: { type: DataTypes.DATE, allowNull: true },
});
