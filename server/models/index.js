const User = require("./User");
const Car = require("./Car");
const Booking = require("./Booking");

User.hasMany(Booking);
Booking.belongsTo(User);

Car.hasMany(Booking);
Booking.belongsTo(Car);

module.exports = { User, Car, Booking };