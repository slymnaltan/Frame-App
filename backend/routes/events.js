const express = require("express");
const QRCode = require("qrcode");
const crypto = require("crypto");

const auth = require("../middleware/authMiddleware");
const Event = require("../models/Event");

const router = express.Router();

const UPLOAD_BASE_URL = process.env.UPLOAD_BASE_URL;

function buildSlug() {
  return crypto.randomBytes(5).toString("hex");
}

async function createUniqueSlug() {
  let slug;
  let exists = true;
  while (exists) {
    slug = buildSlug();
    exists = await Event.exists({ uploadSlug: slug });
  }
  return slug;
}

router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      description,
      eventDate,
      venue,
      rentalStart,
      rentalEnd,
      retentionDays = 30,
      pricingPlan = "standard",
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Etkinlik adı zorunludur" });
    }

    const uploadSlug = await createUniqueSlug();
    const uploadUrl = `${UPLOAD_BASE_URL}/${uploadSlug}`;
    const qrCodeImage = await QRCode.toDataURL(uploadUrl);
    const qrCodeId = crypto.randomUUID
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex");

    const storagePrefix = `events/${req.userId}/${uploadSlug}`;
    const storageExpiresAt = retentionDays
      ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
      : undefined;

    const event = await Event.create({
      owner: req.userId,
      name,
      description,
      eventDate,
      venue,
      rentalStart,
      rentalEnd,
      retentionDays,
      storageExpiresAt,
      storagePrefix,
      pricingPlan,
      uploadSlug,
      uploadUrl,
      qrCodeId,
      qrCodeImage,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Event create error:", error);
    res.status(500).json({ error: "Etkinlik oluşturulamadı" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const events = await Event.find({ owner: req.userId }).sort({
      createdAt: -1,
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Etkinlikler alınamadı" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      owner: req.userId,
    }).lean();

    if (!event) {
      return res.status(404).json({ error: "Etkinlik bulunamadı" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Etkinlik bilgisi alınamadı" });
  }
});

router.get("/:id/uploads", auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!event) {
      return res.status(404).json({ error: "Etkinlik bulunamadı" });
    }

    const uploads = await Upload.find({ event: event._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(uploads);
  } catch (error) {
    res.status(500).json({ error: "Yüklemeler alınamadı" });
  }
});

module.exports = router;

