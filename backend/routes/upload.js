import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ✅ memoryStorage so we can compress with sharp before upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB max from client
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file uploaded" });

    // ✅ Compress + resize (reduces payload & bandwidth)
    const optimized = await sharp(req.file.buffer)
      .rotate() // respects EXIF orientation
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "chitrali_alterations",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(optimized).pipe(stream);
      });

    const result = await streamUpload();

    res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("UPLOAD error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
