const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

// Genel API rate limiter - tüm istekler için
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum 100 istek
  message: { error: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login için sıkı rate limiter - brute force saldırılarını önler
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // IP başına maksimum 5 deneme
  skipSuccessfulRequests: true, // Başarılı istekleri sayma
  message: { error: "Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register için rate limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // IP başına maksimum 3 kayıt
  message: { error: "Çok fazla kayıt denemesi. 1 saat sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Yavaşlatma middleware'i - rate limit'e ulaşmadan önce uyarı
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 dakika
  delayAfter: 50, // 50 istekten sonra yavaşlat
  delayMs: (hits) => hits * 100, // Her istek için 100ms gecikme ekle
});

// MongoSanitize yapılandırması - Express 5 uyumlu
const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key} in request`);
  },
});

module.exports = {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  speedLimiter,
  mongoSanitize: mongoSanitizeMiddleware,
  helmet,
};
