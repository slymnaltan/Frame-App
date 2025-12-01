const express = require("express");
const router = express.Router();
const Iyzipay = require("iyzipay");
const crypto = require("crypto");

const auth = require("../middleware/authMiddleware");
const Payment = require("../models/Payment");
const Event = require("../models/Event");
const User = require("../models/User");
const { calculatePrice, isFree } = require("../config/pricing");
const { createPaymentForm, retrievePaymentResult } = require("../services/paymentService");

// Fiyatlandırma planlarını getir
router.get("/pricing", (req, res) => {
  const { PRICING_PLANS } = require("../config/pricing");
  res.json(PRICING_PLANS);
});

// Ödeme başlat
router.post("/initialize", auth, async (req, res) => {
  try {
    const { rentalPlan, storagePlan, eventData } = req.body;

    if (!rentalPlan || !storagePlan) {
      return res.status(400).json({ error: "Plan seçimi zorunludur" });
    }

    // Fiyat hesapla
    const pricing = calculatePrice(rentalPlan, storagePlan);

    // Ücretsiz plan kontrolü
    if (isFree(rentalPlan, storagePlan)) {
      return res.json({
        isFree: true,
        pricing,
        message: "Ücretsiz plan seçildi, ödeme gerekmiyor",
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
      amount: pricing.totalPrice,
      rentalPlan,
      storagePlan,
      rentalDays: pricing.rentalDays,
      storageDays: pricing.storageDays,
      status: "pending",
    });

    // Basket items oluştur - sadece ücretli olanları ekle
    const basketItems = [];
    if (pricing.rentalPrice > 0) {
      basketItems.push({
        id: "RENTAL",
        name: `Kiralama - ${pricing.rentalLabel}`,
        category1: "Kiralama",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: pricing.rentalPrice.toFixed(2),
      });
    }
    if (pricing.storagePrice > 0) {
      basketItems.push({
        id: "STORAGE",
        name: `Saklama - ${pricing.storageLabel}`,
        category1: "Saklama",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: pricing.storagePrice.toFixed(2),
      });
    }

    // Eğer hiç ücretli ürün yoksa (olmaması lazım ama yine de kontrol)
    if (basketItems.length === 0) {
      return res.status(400).json({ error: "Sepette ücretli ürün bulunamadı" });
    }

    // İyzico ödeme formu oluştur
    const paymentRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId,
      price: pricing.totalPrice.toFixed(2),
      paidPrice: pricing.totalPrice.toFixed(2),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: payment._id.toString(),
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${process.env.API_PUBLIC_URL}/api/payment/callback`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: user._id.toString(),
        name: user.name.split(" ")[0] || "Ad",
        surname: user.name.split(" ")[1] || "Soyad",
        gsmNumber: "+905350000000",
        email: user.email,
        identityNumber: "11111111111",
        registrationAddress: "Adres",
        ip: req.ip || "85.34.78.112",
        city: "Istanbul",
        country: "Turkey",
        zipCode: "34732",
      },
      shippingAddress: {
        contactName: user.name,
        city: "Istanbul",
        country: "Turkey",
        address: "Adres",
        zipCode: "34732",
      },
      billingAddress: {
        contactName: user.name,
        city: "Istanbul",
        country: "Turkey",
        address: "Adres",
        zipCode: "34732",
      },
      basketItems: basketItems,
    };

    console.log("Payment request:", JSON.stringify(paymentRequest, null, 2));
    const result = await createPaymentForm(paymentRequest);
    console.log("Payment result:", JSON.stringify(result, null, 2));

    if (result.status === "success") {
      // Token'ı kaydet
      await Payment.findByIdAndUpdate(payment._id, {
        token: result.token,
        paymentDetails: result,
      });

      res.json({
        success: true,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token,
        conversationId,
        pricing,
      });
    } else {
      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
        errorMessage: result.errorMessage,
      });

      res.status(400).json({
        error: "Ödeme formu oluşturulamadı",
        message: result.errorMessage,
      });
    }
  } catch (error) {
    console.error("Payment initialize error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.response) {
      console.error("Error response:", error.response);
    }
    res.status(500).json({ 
      error: "Ödeme başlatılamadı",
      details: error.message,
      errorData: error.response?.data || null
    });
  }
});

// Ödeme callback
router.post("/callback", async (req, res) => {
  try {
    const { token } = req.body;

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

// Ödeme tamamlandıktan sonra etkinlik oluştur
router.post("/complete-event", auth, async (req, res) => {
  try {
    const { conversationId, eventData, rentalPlan, storagePlan } = req.body;

    let payment;
    let rentalDays, storageDays;

    // Ücretsiz plan kontrolü
    if (conversationId.startsWith('free-')) {
      // Ücretsiz plan için pricing hesapla
      const pricing = calculatePrice(rentalPlan || 'free', storagePlan || 'free');
      rentalDays = pricing.rentalDays;
      storageDays = pricing.storageDays;
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
        return res.status(400).json({ error: "Ödeme henüz tamamlanmadı" });
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
      pricingPlan: payment ? `${payment.rentalPlan}_${payment.storagePlan}` : 'free_free',
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
