const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Booking = sequelize.define("Booking", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  pickupAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  dropAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  distanceKm: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  totalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  pickupLat: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  pickupLng: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  dropLat: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  dropLng: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  paymentStatus: {
    type: DataTypes.ENUM("unpaid", "paid", "refunded"),
    defaultValue: "unpaid",
  },

  stripePaymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  travelDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  travelTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM(
      "pending",
      "accepted",
      "completed",
      "cancelled"
    ),
    defaultValue: "pending",
  },
});

module.exports = Booking;