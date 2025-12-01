const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const uploadRoutes = require("./routes/uploads");
const paymentRoutes = require("./routes/payment");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB'ye başarıyla bağlandı!");
  })
  .catch(err => console.error("MongoDB bağlantı hatası:", err));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Payment callback pages
app.get("/payment-success", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "payment-success.html"));
});

app.get("/payment-failed", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "payment-failed.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", uploadRoutes);
app.use("/api/payment", paymentRoutes);

// Server başlatma
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});