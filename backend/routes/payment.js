const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const auth = require("../middleware/authMiddleware");
const Payment = require("../models/Payment");
const Event = require("../models/Event");
const User = require("../models/User");
const { calculatePrice, isFree } = require("../config/pricing");

// Fiyatlandırma planlarını getir
router.get("/pricing", (req, res) => {
  const { PRICING_PLANS } = require("../config/pricing");
  res.json(PRICING_PLANS);
});

// Ödeme başlat
router.post("/initialize", auth, async (req, res) => {
  try {
    const { planId, eventData } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Paket seçimi zorunludur" });
    }

    const { getPlanDetails, isFree } = require("../config/pricing");
    const plan = getPlanDetails(planId);

    // Ücretsiz plan kontrolü
    if (isFree(planId)) {
      return res.json({
        isFree: true,
        plan,
        message: "Ücretsiz paket seçildi, ödeme gerekmiyor",
      });
    }

    // Kullanıcı bilgilerini al
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // Conversation ID oluştur
    const conversationId = crypto.randomUUID();

    // Payment kaydı oluştur
    const payment = await Payment.create({
      user: req.userId,
      conversationId,
      amount: plan.price,
      rentalPlan: plan.id, // Artık tek bir plan ID'si tutuyoruz
      storagePlan: plan.id, // Uyumluluk için ikisine de aynısını yazıyorum veya şema değişmeli ama şimdilik kalsın
      rentalDays: plan.rentalDays,
      storageDays: plan.storageDays,
      status: "pending",
    });

    // Shopier ödeme linki kullan
    // Paket bazlı link seçimi
    // .env örnekleri: SHOPIER_LINK_BASIC, SHOPIER_LINK_STANDARD, SHOPIER_LINK_PREMIUM
    const linkKey = `SHOPIER_LINK_${planId.toUpperCase()}`;
    const paymentLink = process.env[linkKey];

    if (!paymentLink) {
      return res.status(500).json({ error: "Ödeme linki bulunamadı. Sistem yöneticisiyle iletişime geçin." });
    }

    console.log(`Ödeme için link seçildi: ${paymentLink} (Paket: ${planId})`);

    res.json({
      success: true,
      paymentPageUrl: paymentLink,
      token: "dummy_token_" + conversationId,
      conversationId,
      plan,
    });
  } catch (error) {
    console.error("Payment initialize error:", error);
    res.status(500).json({
      error: "Ödeme başlatılamadı",
      details: error.message
    });
  }
});

// Ödeme callback
router.post("/callback", async (req, res) => {
  try {
    // İyzico token'ı query, body veya form-data olarak gönderebilir
    const token = req.body.token || req.query.token;

    console.log("Callback received - body:", req.body);
    console.log("Callback received - query:", req.query);
    console.log("Token:", token);

    if (!token) {
      return res.status(400).send("Token bulunamadı");
    }

    // Ödeme sonucunu kontrol et
    const result = await retrievePaymentResult(token);

    // Payment kaydını bul
    const payment = await Payment.findOne({ token });

    if (!payment) {
      return res.status(404).send("Ödeme kaydı bulunamadı");
    }

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      // Ödeme başarılı
      payment.status = "success";
      payment.paymentId = result.paymentId;
      payment.paymentDetails = result;
      await payment.save();

      // Etkinlik oluştur (eğer henüz oluşturulmadıysa)
      if (!payment.event) {
        try {
          const QRCode = require("qrcode");
          const crypto = require("crypto");

          const uploadSlug = crypto.randomBytes(5).toString("hex");
          const uploadUrl = `${process.env.UPLOAD_BASE_URL}/${uploadSlug}`;
          const qrCodeImage = await QRCode.toDataURL(uploadUrl);
          const qrCodeId = crypto.randomUUID();

          const now = new Date();
          const rentalEnd = new Date(now);
          rentalEnd.setDate(rentalEnd.getDate() + payment.rentalDays);

          const storageExpiresAt = new Date(rentalEnd);
          storageExpiresAt.setDate(storageExpiresAt.getDate() + payment.storageDays);

          const Event = require("../models/Event");
          const event = await Event.create({
            owner: payment.user,
            name: `Etkinlik - ${payment._id.toString().slice(-6)}`,
            description: "Shopier ile oluşturulan etkinlik",
            qrCodeId,
            uploadSlug,
            qrCodeImage,
            uploadUrl,
            storagePrefix: `events/${payment.user}/${uploadSlug}`,
            pricingPlan: `${payment.rentalPlan}_${payment.storagePlan}`,
            rentalStart: now,
            rentalEnd,
            storageExpiresAt,
            retentionDays: payment.storageDays,
          });

          payment.event = event._id;
          await payment.save();
        } catch (eventError) {
          console.error("Event creation error in callback:", eventError);
        }
      }

      // Başarılı ödeme sayfasına yönlendir
      return res.redirect(`/payment-success?token=${token}`);
    } else {
      // Ödeme başarısız
      payment.status = "failed";
      payment.errorMessage = result.errorMessage;
      payment.paymentDetails = result;
      await payment.save();

      return res.redirect(`/payment-failed?token=${token}`);
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    res.status(500).send("Ödeme doğrulanamadı");
  }
});

// Ödeme durumunu kontrol et
router.get("/status/:conversationId", auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      conversationId: req.params.conversationId,
      user: req.userId,
    });

    if (!payment) {
      return res.status(404).json({ error: "Ödeme bulunamadı" });
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      rentalPlan: payment.rentalPlan,
      storagePlan: payment.storagePlan,
      createdAt: payment.createdAt,
    });
  } catch (error) {
    console.error("Payment status error:", error);
    res.status(500).json({ error: "Ödeme durumu alınamadı" });
  }
});

// Ödeme durumunu manuel olarak onayla (Frontend'den başarılı URL görüldüğünde) - GÜVENLİK NOTU: Shopier API entegrasyonu olmadığı için bu yöntem kullanılıyor
router.post("/confirm-payment", auth, async (req, res) => {
  try {
    const { conversationId } = req.body;

    const payment = await Payment.findOne({
      conversationId,
      user: req.userId,
    });

    if (!payment) {
      return res.status(404).json({ error: "Ödeme bulunamadı" });
    }

    payment.status = "success";
    await payment.save();

    res.json({ success: true, message: "Ödeme onaylandı" });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({ error: "Ödeme onaylanamadı" });
  }
});

// Ödeme tamamlandıktan sonra etkinlik oluştur
router.post("/complete-event", auth, async (req, res) => {
  try {
    const { conversationId, eventData, planId } = req.body;

    let rentalDays, storageDays;
    let payment;

    // Plan detaylarını al
    const { getPlanDetails } = require("../config/pricing");

    // Ücretsiz plan kontrolü
    if (conversationId && conversationId.startsWith('free-')) {
      const plan = getPlanDetails('free');
      rentalDays = plan.rentalDays;
      storageDays = plan.storageDays;
    } else {
      // Ödeme kontrolü
      payment = await Payment.findOne({
        conversationId,
        user: req.userId,
      });

      if (!payment) {
        return res.status(404).json({ error: "Ödeme bulunamadı" });
      }

      if (payment.status !== "success" && payment.amount > 0) {
        return res.status(400).json({ error: "Ödeme henüz tamamlanmadı veya onaylanmadı" });
      }

      // Eğer etkinlik zaten oluşturulmuşsa, mevcut etkinliği döndür
      if (payment.event) {
        const Event = require("../models/Event");
        const existingEvent = await Event.findById(payment.event);
        if (existingEvent) {
          return res.status(200).json({
            success: true,
            event: existingEvent,
            message: "Etkinlik zaten mevcut",
          });
        }
      }

      rentalDays = payment.rentalDays;
      storageDays = payment.storageDays;
    }

    // Etkinlik oluştur
    const QRCode = require("qrcode");
    const crypto = require("crypto");

    const uploadSlug = crypto.randomBytes(5).toString("hex");
    const uploadUrl = `${process.env.UPLOAD_BASE_URL}/${uploadSlug}`;
    const qrCodeImage = await QRCode.toDataURL(uploadUrl);
    const qrCodeId = crypto.randomUUID();

    const now = new Date();
    const rentalEnd = new Date(now);
    rentalEnd.setDate(rentalEnd.getDate() + rentalDays);

    const storageExpiresAt = new Date(rentalEnd);
    storageExpiresAt.setDate(storageExpiresAt.getDate() + storageDays);

    const event = await Event.create({
      owner: req.userId,
      name: eventData.name,
      description: eventData.description,
      eventDate: eventData.eventDate,
      venue: eventData.venue,
      qrCodeId,
      uploadSlug,
      qrCodeImage,
      uploadUrl,
      storagePrefix: `events/${req.userId}/${uploadSlug}`,
      pricingPlan: payment ? `${payment.rentalPlan}` : 'free', // Artık tek plan ismi yazıyoruz
      rentalStart: now,
      rentalEnd,
      storageExpiresAt,
      retentionDays: storageDays,
    });

    // Payment'a event'i bağla (eğer varsa)
    if (payment) {
      payment.event = event._id;
      await payment.save();
    }

    res.status(201).json({
      success: true,
      event,
      message: "Etkinlik başarıyla oluşturuldu",
    });
  } catch (error) {
    console.error("Complete event error:", error);
    res.status(500).json({ error: "Etkinlik oluşturulamadı" });
  }
});

module.exports = router;
