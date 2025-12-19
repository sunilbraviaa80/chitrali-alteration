import express from "express";
import multer from "multer";
import sharp from "sharp";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
});

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // ✅ Compress image BEFORE Cloudinary
    const optimizedBuffer = await sharp(req.file.buffer)
      .rotate()
      .resize({
        width: 1600,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 75,
        mozjpeg: true,
      })
      .toBuffer();

    // ✅ Upload using stream (CORRECT pattern)
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "chitrali-alterations",
            resource_type: "image",
            format: "jpg",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        streamifier.createReadStream(optimizedBuffer).pipe(stream);
      });

    const result = await uploadToCloudinary();

    return res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({
      error: "Image upload failed",
    });
  }
});

export default router;
