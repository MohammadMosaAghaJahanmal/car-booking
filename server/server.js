const express = require("express");
const cors = require("cors");
require("dotenv").config();

const sequelize = require("./config/db");
require("./models");
const authRoutes = require("./routes/authRoutes");
const carRoutes = require("./routes/carRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { protect } = require("./middleware/authMiddleware");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.get("/api/profile", protect, (req, res) => {
  res.json({
    message: "Protected profile route",
    user: req.user,
  });
});

app.get("/", (req, res) => {
  res.send("Car Booking Backend API is running...");
});
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
.then(async () => {
    console.log("MySQL connected successfully");

    await sequelize.sync({ alter: true });
    console.log("Tables synced");

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})