const express = require("express");
const multer = require("multer");
const archiver = require("archiver");
const jwt = require("jsonwebtoken");

const Event = require("../models/Event");
const { uploadFile, getFileStream, listFiles } = require("../services/storageService");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize:
      Number(process.env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024,
  },
});

async function findEventByCode(eventCode) {
  if (!eventCode) return null;
  const query = [{ uploadSlug: eventCode }];
  if (eventCode.match(/^[0-9a-fA-F]{24}$/)) {
    query.push({ _id: eventCode });
  }
  return Event.findOne({ $or: query });
}

router.post(
  "/upload/:eventCode",
  upload.single("file"),
  async (req, res) => {
    try {
      const event = await findEventByCode(req.params.eventCode);
      if (!event) {
        return res.status(404).json({ error: "Etkinlik bulunamadı" });
      }

      // Kiralama süresi bittiyse yeni upload'a izin verme
      if (event.rentalEnd && new Date(event.rentalEnd) < new Date()) {
        return res
          .status(403)
          .json({ error: "Maalesef Bu etkinliğin kiralama süresi sona erdi. Gösterdiğiniz ilgi için çook teşekkür ederiz." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Dosya gerekli" });
      }

      const fileSafeName = req.file.originalname
        .normalize("NFKD")
        .replace(/[^\w.-]/g, "_");
      const storageKey = `${event.storagePrefix}/${Date.now()}-${fileSafeName}`;

      await uploadFile({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        key: storageKey,
      });

      res.status(201).json({
        message: "Dosya başarıyla yüklendi",
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Dosya yüklenemedi" });
    }
  }
);

const authenticateOwner = (req, res, next) => {
  const headerToken = req.headers.authorization?.split(" ")[1];
  const queryToken = req.query.token;
  const token = headerToken || queryToken;

  if (!token) {
    return res.status(401).json({ error: "Yetkisiz erişim" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token geçersiz" });
  }
};

router.get("/download/:eventId", authenticateOwner, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      owner: req.userId,
    });

    if (!event) {
      return res.status(404).json({ error: "Etkinlik bulunamadı" });
    }

    const uploads = await listFiles(event.storagePrefix);

    if (!uploads || uploads.length === 0) {
      return res.status(404).json({ error: "İndirilecek içerik yok" });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${event.name || "event"}-${event._id}.zip`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", err => {
      console.error("Archive error:", err);
      res.status(500).end();
    });

    archive.pipe(res);

    for (const file of uploads) {
      const { stream } = await getFileStream(file.key);
      archive.append(stream, {
        name: file.name || `upload-${event._id}`,
      });
    }

    archive.finalize();
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Dosyalar indirilemedi" });
  }
});

module.exports = router;

