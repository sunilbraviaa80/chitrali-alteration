// backend/routes/alterations.js
import express from "express";
import { query } from "../db.js";

const router = express.Router();

<<<<<<< HEAD
function toBool(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

// GET /alterations – list all
=======
const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";

const normalizeStatus = (status) => {
  const s = (status || "PENDING").toString().toUpperCase();
  if (s === "DONE" || s === "IN_PROGRESS" || s === "PENDING") return s;
  return "PENDING";
};

// GET /alterations
>>>>>>> edcb81ca66dcd526fe8d6dd7590e63b11aae3318
router.get("/", async (req, res) => {
  try {
    const result = await query("SELECT * FROM alterations ORDER BY id DESC", []);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /alterations error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

<<<<<<< HEAD
// POST /alterations – create (JSON)
=======
// POST /alterations (JSON only)
>>>>>>> edcb81ca66dcd526fe8d6dd7590e63b11aae3318
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
<<<<<<< HEAD
    imageUrl,
    notes
=======
    imageUrl, // should come from /upload
>>>>>>> edcb81ca66dcd526fe8d6dd7590e63b11aae3318
  } = req.body;

  if (!billNumber || !tailorName || !itemName) {
    return res.status(400).json({
      error: "billNumber, tailorName, itemName are required",
    });
  }

  const packedValue = toBool(packed);
<<<<<<< HEAD
  const finalStatus = packedValue ? "DONE" : (status || "PENDING");
=======
  const statusValue = packedValue ? "DONE" : normalizeStatus(status);
>>>>>>> edcb81ca66dcd526fe8d6dd7590e63b11aae3318

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
<<<<<<< HEAD
        finalStatus,
=======
        statusValue,
>>>>>>> edcb81ca66dcd526fe8d6dd7590e63b11aae3318
        packedValue,
        imageUrl || null,
        notes || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /alterations error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

<<<<<<< HEAD
// PUT /alterations/:id – full update (JSON)
// image_url is NOT cleared if imageUrl is missing/empty
=======
// PUT /alterations/:id (JSON only)
>>>>>>> edcb81ca66dcd526fe8d6dd7590e63b11aae3318
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
    notes
  } = req.body;

  const packedValue = toBool(packed);
<<<<<<< HEAD
  const finalStatus = packedValue ? "DONE" : (status || "PENDING");

  // Treat empty string as null so COALESCE keeps old value
  const imageUrlValue = (typeof imageUrl === "string" && imageUrl.trim() === "")
    ? null
    : (imageUrl ?? null);
=======
  const statusValue = packedValue ? "DONE" : normalizeStatus(status);
>>>>>>> edcb81ca66dcd526fe8d6dd7590e63b11aae3318

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
<<<<<<< HEAD
        finalStatus,
=======
        statusValue,
>>>>>>> edcb81ca66dcd526fe8d6dd7590e63b11aae3318
        packedValue,
        imageUrlValue,
        notes || null,
        id
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /alterations/:id error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

<<<<<<< HEAD
=======
// PATCH /alterations/:id/status (status + packed toggle from table)
router.patch("/:id/status", async (req, res) => {
  const id = req.params.id;
  const packedValue = toBool(req.body.packed);
  const statusValue = packedValue ? "DONE" : normalizeStatus(req.body.status);

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

    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /alterations/:id/status error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

>>>>>>> edcb81ca66dcd526fe8d6dd7590e63b11aae3318
export default router;
