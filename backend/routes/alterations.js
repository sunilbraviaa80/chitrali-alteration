import express from "express";
import { query } from "../db.js";

const router = express.Router();

/* ------------------ helpers ------------------ */

const toBool = (v) =>
  v === true || v === "true" || v === 1 || v === "1";

const normalizeStatus = (status) => {
  const s = (status || "PENDING").toString().toUpperCase();
  if (["DONE", "IN_PROGRESS", "PENDING"].includes(s)) return s;
  return "PENDING";
};

/* ------------------ GET all ------------------ */

router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM alterations ORDER BY id DESC",
      []
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /alterations error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ------------------ CREATE ------------------ */
/* JSON only — imageUrl must come from upload API */

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

  if (!billNumber || !tailorName || !itemName) {
    return res.status(400).json({
      error: "billNumber, tailorName, itemName are required",
    });
  }

  const packedValue = toBool(packed);
  const statusValue = packedValue
    ? "DONE"
    : normalizeStatus(status);

  try {
    const result = await query(
      `INSERT INTO alterations
       (bill_number, tailor_name, item_name,
        date_assigned, date_delivery, time_delivery,
        status, packed, image_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        billNumber,
        tailorName,
        itemName,
        dateAssigned || null,
        dateDelivery || null,
        timeDelivery || null,
        statusValue,
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

/* ------------------ UPDATE FULL ------------------ */

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

  const packedValue = toBool(packed);
  const statusValue = packedValue
    ? "DONE"
    : normalizeStatus(status);

  const imageUrlValue =
    typeof imageUrl === "string" && imageUrl.trim() === ""
      ? null
      : imageUrl ?? null;

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
           image_url     = COALESCE($9, image_url),
           notes         = $10,
           updated_at    = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        billNumber,
        tailorName,
        itemName,
        dateAssigned || null,
        dateDelivery || null,
        timeDelivery || null,
        statusValue,
        packedValue,
        imageUrlValue,
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

/* ------------------ PATCH STATUS / PACKED ------------------ */

router.patch("/:id/status", async (req, res) => {
  const id = req.params.id;

  const packedValue = toBool(req.body.packed);
  const statusValue = packedValue
    ? "DONE"
    : normalizeStatus(req.body.status);

  try {
    const result = await query(
      `UPDATE alterations
       SET status = $1,
           packed = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [statusValue, packedValue, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /alterations/:id/status error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ------------------ EXPORT ------------------ */

export default router;
