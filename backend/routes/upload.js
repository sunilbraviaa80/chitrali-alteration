// backend/routes/upload.js
import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ✅ Use memory storage so Sharp can compress before upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024, // 12MB
  },
});

// POST /upload  (multipart/form-data, field name: "image")
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    // ✅ Optimize image (rotate + resize + compress)
    const optimizedBuffer = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "chitrali_alterations",
          resource_type: "image",
        },
        (error, uploaded) => {
          if (error) return reject(error);
          resolve(uploaded);
        }
      );

      streamifier.createReadStream(optimizedBuffer).pipe(stream);
    });

    return res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("UPLOAD error:", err);
    return res.status(500).json({ error: "Image upload failed" });
  }
});

export default router;
