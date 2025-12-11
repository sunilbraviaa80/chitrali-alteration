// backend/routes/alterations.js
import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * GET /alterations
 * List all alteration records
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM alterations ORDER BY created_at DESC`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /alterations error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * POST /alterations
 * Create a new record
 */
router.post('/', async (req, res) => {
  const {
    billNumber,
    tailorName,
    itemName,
    dateAssigned,
    dateDelivery,
    timeDelivery,
    status,
    packed
  } = req.body;

  if (!billNumber || !tailorName || !itemName) {
    return res.status(400).json({
      error: 'billNumber, tailorName, itemName are required'
    });
  }

  // Convert any form/JSON representation to true/false
  const packedValue =
    packed === true ||
    packed === "true" ||
    packed === 1 ||
    packed === "1";

  try {
    const result = await query(
      `INSERT INTO alterations
         (bill_number, tailor_name, item_name, date_assigned, date_delivery, time_delivery, status, packed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        billNumber,
        tailorName,
        itemName,
        dateAssigned || null,
        dateDelivery || null,
        timeDelivery || null,
        status || 'PENDING',
        packedValue
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /alterations error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * PUT /alterations/:id
 * Update an existing record
 */
router.put('/:id', async (req, res) => {
  const id = req.params.id;

  const {
    billNumber,
    tailorName,
    itemName,
    dateAssigned,
    dateDelivery,
    timeDelivery,
    status,
    packed
  } = req.body;

  const packedValue =
    packed === true ||
    packed === "true" ||
    packed === 1 ||
    packed === "1";

  try {
    const result = await query(
      `UPDATE alterations
         SET bill_number=$1,
             tailor_name=$2,
             item_name=$3,
             date_assigned=$4,
             date_delivery=$5,
             time_delivery=$6,
             status=$7,
             packed=$8,
             updated_at=NOW()
       WHERE id=$9
       RETURNING *`,
      [
        billNumber,
        tailorName,
        itemName,
        dateAssigned || null,
        dateDelivery || null,
        timeDelivery || null,
        status || 'PENDING',
        packedValue,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /alterations/:id error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

