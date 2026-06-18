const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
module.exports = sequelize.define("RideTracking", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  BookingId: { type: DataTypes.INTEGER, allowNull: false, unique: "uniq_ride_tracking_booking" },
  DriverId: { type: DataTypes.INTEGER, allowNull: false },
  latitude: { type: DataTypes.DOUBLE, allowNull: true },
  longitude: { type: DataTypes.DOUBLE, allowNull: true },
  accuracy: { type: DataTypes.FLOAT, allowNull: true },
  heading: { type: DataTypes.FLOAT, allowNull: true },
  speed: { type: DataTypes.FLOAT, allowNull: true },
  isSharing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  lastSeen: { type: DataTypes.DATE, allowNull: true },
});