import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// 🚫 Reject JSON uploads immediately
router.use harmoniously = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return res.status(415).json({
      error: "Use multipart/form-data for /upload",
    });
  }
  next();
};

// ✅ Memory storage so Sharp can compress
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6 MB max
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    // ✅ Compress & resize
    const optimized = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "chitrali_alterations" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        streamifier.createReadStream(optimized).pipe(stream);
      });

    const result = await uploadToCloudinary();

    res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
