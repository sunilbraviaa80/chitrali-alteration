import express from "express";
import { query } from "../db.js";

const router = express.Router();

// GET
router.get("/", async (req, res) => {
  const result = await query(
    "SELECT * FROM alterations ORDER BY id DESC",
    []
  );
  res.json(result.rows);
});

// POST
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
    thumbUrl
  } = req.body;

  const result = await query(
    `INSERT INTO alterations
      (bill_number, tailor_name, item_name,
       date_assigned, date_delivery, time_delivery,
       status, packed, image_url, thumb_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      billNumber,
      tailorName,
      itemName,
      dateAssigned || null,
      dateDelivery || null,
      timeDelivery || null,
      status || "PENDING",
      packed || false,
      imageUrl || null,
      thumbUrl || null
    ]
  );

  res.json(result.rows[0]);
});

export default router;
