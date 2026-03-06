import express from "express";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = process.env.SUPABASE_BUCKET;
const MAX_MB = parseInt(process.env.MAX_UPLOAD_MB || "20");
const MAX_BYTES = MAX_MB * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const original = req.file.buffer;

    // Main compressed image
    const mainBuffer = await sharp(original)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    // Thumbnail
    const thumbBuffer = await sharp(original)
      .rotate()
      .resize({ width: 320, height: 320, fit: "cover" })
      .jpeg({ quality: 65 })
      .toBuffer();

    const id = uuidv4();
    const dateFolder = new Date().toISOString().slice(0, 10);

    const mainPath = `${dateFolder}/${id}.jpg`;
    const thumbPath = `${dateFolder}/${id}_thumb.jpg`;

    // Upload main
    const { error: mainError } = await supabase.storage
      .from(BUCKET)
      .upload(mainPath, mainBuffer, {
        contentType: "image/jpeg",
        upsert: false
      });

    if (mainError) throw mainError;

    // Upload thumb
    const { error: thumbError } = await supabase.storage
      .from(BUCKET)
      .upload(thumbPath, thumbBuffer, {
        contentType: "image/jpeg",
        upsert: false
      });

    if (thumbError) throw thumbError;

    const { data: mainPublic } = supabase.storage.from(BUCKET).getPublicUrl(mainPath);
    const { data: thumbPublic } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath);

    res.json({
      imageUrl: mainPublic.publicUrl,
      thumbUrl: thumbPublic.publicUrl
    });

  } catch (err) {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `Max ${MAX_MB}MB allowed.` });
    }
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
