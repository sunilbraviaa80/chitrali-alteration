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
    fileSize: 20 * 1024 * 1024, // 20 MB hard cap
  },
});

// POST /upload  (multipart/form-data, field name: "image")
router.post(
  "/upload",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // 🔹 Compress & resize BEFORE upload
      const optimizedBuffer = await sharp(req.file.buffer)
        .rotate() // auto-orient
        .resize({
          width: 1600,          // max width
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 75,          // 70–80 is ideal
          mozjpeg: true,
        })
        .toBuffer();

      // 🔹 Upload optimized image to Cloudinary
      const result = await cloudinary.uploader.upload_stream(
        {
          folder: "chitrali-alterations",
          resource_type: "image",
          format: "jpg",
        },
        (error, uploaded) => {
          if (error) {
            console.error(error);
            return res.status(500).json({ error: "Cloudinary upload failed" });
          }

          res.json({ imageUrl: uploaded.secure_url });
        }
      );

      result.end(optimizedBuffer);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Image processing failed" });
    }
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
