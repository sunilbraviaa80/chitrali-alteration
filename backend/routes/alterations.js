import express from "express";
import { query } from "../db.js";

const router = express.Router();

function rejectInlineImage(url) {
  return typeof url === "string" && (url.startsWith("data:image/") || url.startsWith("blob:"));
}

router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "25", 10), 1), 100);
    const offset = (page - 1) * limit;

    const bill = (req.query.bill || "").trim();
    const tailor = (req.query.tailor || "").trim();
    const status = (req.query.status || "").trim();
    const dateAssigned = (req.query.dateAssigned || "").trim();
    const dateDelivery = (req.query.dateDelivery || "").trim();

    const where = [];
    const params = [];
    let p = 1;

    if (bill) {
      where.push(`bill_number ILIKE $${p++}`);
      params.push(`%${bill}%`);
    }
    if (tailor) {
      where.push(`tailor_name = $${p++}`);
      params.push(tailor);
    }
    if (status) {
      where.push(`status = $${p++}`);
      params.push(status);
    }
    if (dateAssigned) {
      where.push(`date_assigned = $${p++}`);
      params.push(dateAssigned);
    }
    if (dateDelivery) {
      where.push(`date_delivery = $${p++}`);
      params.push(dateDelivery);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countSql = `SELECT COUNT(*)::int AS total FROM alterations ${whereSql}`;
    const countResult = await query(countSql, params);
    const total = countResult.rows[0]?.total || 0;

    const dataSql = `
      SELECT *
      FROM alterations
      ${whereSql}
      ORDER BY id DESC
      LIMIT $${p++} OFFSET $${p++}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await query(dataSql, dataParams);

    return res.json({
      rows: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("GET /alterations error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

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
    thumbUrl,
    notes
  } = req.body;

  if (!billNumber || !tailorName || !itemName) {
    return res.status(400).json({ error: "billNumber, tailorName and itemName are required" });
  }

  if (rejectInlineImage(imageUrl) || rejectInlineImage(thumbUrl)) {
    return res.status(413).json({ error: "Do not send base64/blob image URLs. Upload via /upload first." });
  }

  try {
    const result = await query(
      `INSERT INTO alterations
        (bill_number, tailor_name, item_name, date_assigned, date_delivery, time_delivery, status, packed, image_url, thumb_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        billNumber,
        tailorName,
        itemName,
        dateAssigned || null,
        dateDelivery || null,
        timeDelivery || null,
        status || "PENDING",
        packed === true || packed === "true" || packed === 1 || packed === "1",
        imageUrl || null,
        thumbUrl || null,
        notes || null
      ]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /alterations error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

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
    thumbUrl,
    notes
  } = req.body;

  if (!billNumber || !tailorName || !itemName) {
    return res.status(400).json({ error: "billNumber, tailorName and itemName are required" });
  }

  if (rejectInlineImage(imageUrl) || rejectInlineImage(thumbUrl)) {
    return res.status(413).json({ error: "Do not send base64/blob image URLs. Upload via /upload first." });
  }

  try {
    const result = await query(
      `UPDATE alterations
          SET bill_number = $1,
              tailor_name = $2,
              item_name = $3,
              date_assigned = $4,
              date_delivery = $5,
              time_delivery = $6,
              status = $7,
              packed = $8,
              image_url = $9,
              thumb_url = $10,
              notes = $11,
              updated_at = now()
        WHERE id = $12
        RETURNING *`,
      [
        billNumber,
        tailorName,
        itemName,
        dateAssigned || null,
        dateDelivery || null,
        timeDelivery || null,
        status || "PENDING",
        packed === true || packed === "true" || packed === 1 || packed === "1",
        imageUrl || null,
        thumbUrl || null,
        notes || null,
        id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Record not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /alterations/:id error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await query("DELETE FROM alterations WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error("DELETE /alterations/:id error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

export default router;
