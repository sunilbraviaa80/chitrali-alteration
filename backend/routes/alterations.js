import express from "express";
import { query } from "../db.js";

const router = express.Router();

const normalizePacked = (packed) =>
  packed === true || packed === "true" || packed === 1 || packed === "1";

const isBase64Image = (v) =>
  typeof v === "string" && v.startsWith("data:image/");

// GET /alterations  – list all
router.get("/", async (req, res) => {
  try {
    const result = await query("SELECT * FROM alterations ORDER BY id DESC", []);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /alterations error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /alterations – create
router.post("/", async (req, res) => {
  const {
    billNumber,
    tailorName,
    itemName,
    dateAssigned,
    dateDelivery,
    timeDelivery,
    status,
    packed,
    imageUrl,
    notes,
  } = req.body;

  // 🚫 Block base64 images (prevents PayloadTooLarge permanently)
  if (isBase64Image(imageUrl)) {
    return res.status(413).json({
      error: "Do not send base64 images. Upload via /upload first and send only imageUrl.",
    });
  }

  if (!billNumber || !tailorName || !itemName) {
    return res
      .status(400)
      .json({ error: "billNumber, tailorName, itemName are required" });
  }

  const packedValue = normalizePacked(packed);

  try {
    const result = await query(
      `INSERT INTO alterations
        (bill_number, tailor_name, item_name,
         date_assigned, date_delivery, time_delivery,
         status, packed, image_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        String(billNumber).trim(),
        String(tailorName).trim(),
        String(itemName).trim(),
        dateAssigned || null,
        dateDelivery || null,
        timeDelivery || null,
        status || "PENDING",
        packedValue,
        imageUrl || null,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /alterations error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /alterations/:id – full update (frontend uses this)
router.put("/:id", async (req, res) => {
  const id = req.params.id;

  const {
    billNumber,
    tailorName,
    itemName,
    dateAssigned,
    dateDelivery,
    timeDelivery,
    status,
    packed,
    imageUrl,
    notes,
  } = req.body;

  // 🚫 Block base64 images
  if (isBase64Image(imageUrl)) {
    return res.status(413).json({
      error: "Do not send base64 images. Upload via /upload first and send only imageUrl.",
    });
  }

  if (!billNumber || !tailorName || !itemName) {
    return res
      .status(400)
      .json({ error: "billNumber, tailorName, itemName are required" });
  }

  const packedValue = normalizePacked(packed);

  try {
    const result = await query(
      `UPDATE alterations
         SET bill_number   = $1,
             tailor_name   = $2,
             item_name     = $3,
             date_assigned = $4,
             date_delivery = $5,
             time_delivery = $6,
             status        = $7,
             packed        = $8,
             image_url     = $9,
             notes         = $10,
             updated_at    = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        String(billNumber).trim(),
        String(tailorName).trim(),
        String(itemName).trim(),
        dateAssigned || null,
        dateDelivery || null,
        timeDelivery || null,
        status || "PENDING",
        packedValue,
        imageUrl || null,
        notes || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /alterations/:id error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
