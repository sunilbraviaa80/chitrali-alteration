// backend/routes/upload.js
import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ✅ memory storage so Sharp can process image before Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // ✅ 20MB max
});

  // ✅ Increase input limit (phone camera photos are often 8–12MB)
  // You can set 15MB if needed:
  limits: { fileSize: 12 * 1024 * 1024 }, // 12 MB

  // ✅ Allow only images
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// ✅ Wrap multer so we can return a friendly JSON error for large files
function uploadSingle(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "Image too large. Please choose a smaller image (max 12MB) or compress it.",
      });
    }
    if (err) {
      return res.status(400).json({ error: err.message || "Upload error" });
    }
    next();
  });
}

router.post("/", uploadSingle, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file uploaded" });

    // ✅ Compress + resize to reduce bandwidth/storage
    // Use JPEG output for strong compression. (Works fine for most clothing images.)
    const optimizedBuffer = await sharp(req.file.buffer)
      .rotate() // respects EXIF orientation
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    const uploadResult = await new Promise((resolve, reject) => {
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

      streamifier.createReadStream(optimizedBuffer).pipe(stream);
    });

    return res.json({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (err) {
    console.error("UPLOAD error:", err);
    return res.status(500).json({ error: "Image upload failed" });
  }
});

export default router;
