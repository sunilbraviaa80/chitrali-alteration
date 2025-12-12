import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../cloudinary.js";

const router = express.Router();

// memory storage (no disk on Render)
const upload = multer({ storage: multer.memoryStorage() });

// POST /upload  (field name must be "image")
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded (field: image)" });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "chitrali-alterations" },
        (err, uploaded) => (err ? reject(err) : resolve(uploaded))
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    return res.json({ imageUrl: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error("POST /upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
