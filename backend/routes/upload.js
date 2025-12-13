// backend/routes/upload.js
import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Multer: memory storage + size limit (prevents huge uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// POST /upload  (multipart/form-data with field name = "image")
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    // Compress/resize with Sharp (keeps uploads small + fast)
    // You can tweak maxWidth/quality as needed.
    const compressedBuffer = await sharp(req.file.buffer)
      .rotate() // auto-rotate based on EXIF
      .resize({ width: 1280, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "chitrali-alterations",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }
        return res.json({
          imageUrl: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    streamifier.createReadStream(compressedBuffer).pipe(uploadStream);
  } catch (err) {
    console.error("Upload route error:", err);
    // Multer file size error
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Image too large (max 5MB)" });
    }
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

export default router;
