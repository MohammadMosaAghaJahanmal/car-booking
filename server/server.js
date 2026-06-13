const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const sequelize = require("./config/db");
require("./models");
const authRoutes = require("./routes/authRoutes");
const carRoutes = require("./routes/carRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const settingRoutes = require("./routes/settingRoutes");
const setupTrackingSocket = require("./socket/trackingSocket");
const { protect } = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.WEB_URL || "http://localhost:3000", methods: ["GET", "POST"] } });
setupTrackingSocket(io);
app.set("io", io);

app.use(cors({ origin: process.env.WEB_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/settings", settingRoutes);
app.get("/api/profile", protect, (req, res) => res.json({ message: "Protected profile route", user: req.user }));
app.get("/", (req, res) => res.send("Car Booking Backend API is running..."));
app.use((error, _req, res, next) => {
  if (error?.name === "MulterError") return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Image must be smaller than 5 MB" : "Only one JPG, PNG, or WebP image is allowed" });
  next(error);
});
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

const PORT = process.env.PORT || 5000;
sequelize.authenticate()
  .then(async () => {
    console.log("MySQL connected successfully");
    await sequelize.sync();
    console.log("Tables synced");
    server.listen(PORT, () => console.log("Server running on port " + PORT));
  })
  .catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });
