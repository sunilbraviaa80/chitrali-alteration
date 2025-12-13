// backend/routes/upload.js
import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import { cloudinary } from "../config/cloudinary.js";

const router = express.Router();

// Store uploaded file in memory (no disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// POST /upload  (multipart/form-data with key: image)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "chitrali-alterations" },
        (err, out) => (err ? reject(err) : resolve(out))
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    return res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("POST /upload error:", err);
    return res.status(500).json({ error: "Image upload failed" });
  }
});

export default router;
