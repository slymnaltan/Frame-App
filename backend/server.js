const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const uploadRoutes = require("./routes/uploads");
const paymentRoutes = require("./routes/payment");
require("./cronJobs"); // Zamanlanmış görevleri başlat

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Form-data için
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

// ADMIN: Manuel Temizlik Tetikleyici
// Bu endpoint dış servisler (cron-job.org) tarafından çağrılabilir.
// Güvenlik: Header'da "x-admin-key" kontrolü yapılır.
app.post("/api/admin/cleanup", (req, res) => {
  const adminKey = process.env.ADMIN_API_KEY || "my-secret-admin-key";
  const requestKey = req.headers["x-admin-key"];

  if (requestKey !== adminKey) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  const { runCleanupTask } = require("./cronJobs");

  // Fire-and-forget: Hemen cevap ver, işlemi arkada yap
  res.status(202).json({
    message: "Cleanup task accepted and started in background.",
    status: "processing"
  });

  // Arka planda çalıştır (Hata yakalayıp logla ki sunucu çökmesin)
  runCleanupTask().catch(err => {
    console.error("❌ [Background Task] Cleanup failed:", err);
  });
});

// Server başlatma
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});