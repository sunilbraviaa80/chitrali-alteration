<<<<<<< HEAD
// server.js – full backend for Chitrali Alteration Tracker
//
// Features:
// - SQLite database (data.db)
// - User table with default admin (on first run)
// - JWT-based login (/api/login)
// - Auth middleware (Bearer token)
// - CRUD for alteration work (/api/work, /api/work/:id)
// - Status/packed quick update (/api/work/:id/status)
// - Image upload via multer to /uploads + public URL
// - Health check (/api/health)

const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// ---------- Basic config ----------
const PORT = process.env.PORT || 4000;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "data.db");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-change-me";
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@tracker.local";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded images
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use("/uploads", express.static(uploadsDir));

// ---------- Multer (file upload) ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const base = path.basename(file.originalname || "image", ext);
    const safeBase = base.replace(/[^a-z0-9_-]/gi, "_");
    cb(null, Date.now() + "_" + safeBase + ext);
  },
});
const upload = multer({ storage });

// ---------- SQLite setup ----------
const db = new sqlite3.Database(DB_FILE);

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Create tables + default admin
async function initDb() {
  await runAsync(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL
    )`
  );

  await runAsync(
    `CREATE TABLE IF NOT EXISTS work_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT NOT NULL,
      tailor_name TEXT NOT NULL,
      item_name TEXT NOT NULL,
      date_assigned TEXT,
      date_delivery TEXT,
      time_delivery TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      packed INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      image_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  );

  // Ensure default admin user exists
  const existing = await getAsync(
    "SELECT id FROM users WHERE email = ?",
    [ADMIN_EMAIL]
  );
  if (!existing) {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await runAsync(
      "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
      [ADMIN_EMAIL, hash, ADMIN_NAME]
    );
    console.log(
      `Created default admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`
    );
  }
}

// ---------- Auth helpers ----------
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const [, token] = authHeader.split(" ");
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ---------- Routes ----------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }
    const user = await getAsync(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Build WHERE clause for filters
function buildWorkFilter(query, paramsOut) {
  const where = [];
  if (query.bill) {
    where.push("bill_number LIKE ?");
    paramsOut.push(`%${query.bill}%`);
  }
  if (query.tailor) {
    where.push("tailor_name LIKE ?");
    paramsOut.push(`%${query.tailor}%`);
  }
  if (query.status) {
    where.push("status = ?");
    paramsOut.push(query.status);
  }
  if (query.packed === "1" || query.packed === "0") {
    where.push("packed = ?");
    paramsOut.push(query.packed === "1" ? 1 : 0);
  }
  if (query.date) {
    // exact delivery date
    where.push("date_delivery = ?");
    paramsOut.push(query.date);
  }
  return where.length ? "WHERE " + where.join(" AND ") : "";
}

// List work (with filters)
app.get("/api/work", authMiddleware, async (req, res) => {
  try {
    const params = [];
    const whereSql = buildWorkFilter(req.query, params);
    const rows = await allAsync(
      `SELECT * FROM work_items ${whereSql} ORDER BY date_assigned DESC, id DESC`,
      params
    );
    const mapped = rows.map((r) => ({
      id: r.id,
      bill_number: r.bill_number,
      tailor_name: r.tailor_name,
      item_name: r.item_name,
      date_assigned: r.date_assigned,
      date_delivery: r.date_delivery,
      time_delivery: r.time_delivery,
      status: r.status,
      packed: !!r.packed,
      notes: r.notes,
      image_url: r.image_path ? "/uploads/" + r.image_path : null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/work error:", err);
    res.status(500).json({ error: "Failed to load work items" });
  }
});

// Create work
app.post(
  "/api/work",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        bill_number,
        tailor_name,
        item_name,
        date_assigned,
        date_delivery,
        time_delivery,
        status,
        packed,
        notes,
      } = req.body;

      if (!bill_number || !tailor_name || !item_name) {
        return res.status(400).json({
          error: "bill_number, tailor_name and item_name are required",
        });
      }

      const packedVal =
        packed === "1" || packed === "true" || packed === true ? 1 : 0;
      const statusVal = status || "PENDING";
      const imagePath = req.file ? req.file.filename : null;

      const result = await runAsync(
        `INSERT INTO work_items
         (bill_number, tailor_name, item_name, date_assigned,
          date_delivery, time_delivery, status, packed, notes, image_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bill_number,
          tailor_name,
          item_name,
          date_assigned || null,
          date_delivery || null,
          time_delivery || null,
          statusVal,
          packedVal,
          notes || null,
          imagePath,
        ]
      );

      const row = await getAsync(
        "SELECT * FROM work_items WHERE id = ?",
        [result.lastID]
      );

      res.status(201).json({
        id: row.id,
        bill_number: row.bill_number,
        tailor_name: row.tailor_name,
        item_name: row.item_name,
        date_assigned: row.date_assigned,
        date_delivery: row.date_delivery,
        time_delivery: row.time_delivery,
        status: row.status,
        packed: !!row.packed,
        notes: row.notes,
        image_url: row.image_path ? "/uploads/" + row.image_path : null,
      });
    } catch (err) {
      console.error("POST /api/work error:", err);
      res.status(500).json({ error: "Failed to create work item" });
    }
  }
);

// Update work
app.put(
  "/api/work/:id",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const existing = await getAsync(
        "SELECT * FROM work_items WHERE id = ?",
        [id]
      );
      if (!existing) {
        return res.status(404).json({ error: "Work item not found" });
      }

      const {
        bill_number,
        tailor_name,
        item_name,
        date_assigned,
        date_delivery,
        time_delivery,
        status,
        packed,
        notes,
      } = req.body;

      const packedVal =
        packed === "1" || packed === "true" || packed === true ? 1 : 0;
      const statusVal = status || "PENDING";
      let imagePath = existing.image_path;

      if (req.file) {
        // delete old image
        if (imagePath) {
          const oldPath = path.join(uploadsDir, imagePath);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (e) {
              console.warn("Failed to delete old image:", e.message);
            }
          }
        }
        imagePath = req.file.filename;
      }

      await runAsync(
        `UPDATE work_items SET
          bill_number = ?, tailor_name = ?, item_name = ?,
          date_assigned = ?, date_delivery = ?, time_delivery = ?,
          status = ?, packed = ?, notes = ?, image_path = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          bill_number || existing.bill_number,
          tailor_name || existing.tailor_name,
          item_name || existing.item_name,
          date_assigned || existing.date_assigned,
          date_delivery || existing.date_delivery,
          time_delivery || existing.time_delivery,
          statusVal,
          packedVal,
          notes != null ? notes : existing.notes,
          imagePath,
          id,
        ]
      );

      const row = await getAsync(
        "SELECT * FROM work_items WHERE id = ?",
        [id]
      );

      res.json({
        id: row.id,
        bill_number: row.bill_number,
        tailor_name: row.tailor_name,
        item_name: row.item_name,
        date_assigned: row.date_assigned,
        date_delivery: row.date_delivery,
        time_delivery: row.time_delivery,
        status: row.status,
        packed: !!row.packed,
        notes: row.notes,
        image_url: row.image_path ? "/uploads/" + row.image_path : null,
      });
    } catch (err) {
      console.error("PUT /api/work/:id error:", err);
      res.status(500).json({ error: "Failed to update work item" });
    }
  }
);

// Update status / packed only
app.patch("/api/work/:id/status", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { status, packed } = req.body || {};

    const existing = await getAsync(
      "SELECT * FROM work_items WHERE id = ?",
      [id]
    );
    if (!existing) {
      return res.status(404).json({ error: "Work item not found" });
    }

    const packedVal =
      packed === "1" ||
      packed === "true" ||
      packed === true ||
      packed === 1
        ? 1
        : 0;
    const statusVal = status || existing.status;

    await runAsync(
      `UPDATE work_items
       SET status = ?, packed = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [statusVal, packedVal, id]
    );

    const row = await getAsync(
      "SELECT * FROM work_items WHERE id = ?",
      [id]
    );

    res.json({
      id: row.id,
      bill_number: row.bill_number,
      tailor_name: row.tailor_name,
      item_name: row.item_name,
      date_assigned: row.date_assigned,
      date_delivery: row.date_delivery,
      time_delivery: row.time_delivery,
      status: row.status,
      packed: !!row.packed,
      notes: row.notes,
      image_url: row.image_path ? "/uploads/" + row.image_path : null,
    });
  } catch (err) {
    console.error("PATCH /api/work/:id/status error:", err);
    res.status(500).json({ error: "Failed to update status/packed" });
  }
});

// ---------- Start server ----------
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init DB:", err);
    process.exit(1);
  });
=======
const express = require('express');
const path = require('path');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const db = new sqlite3.Database('data.db');
app.get('/api/health', (req,res)=>res.json({ok:true}));
const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log('Running on '+PORT));
>>>>>>> 16bbc7d (Fix backend start config and dependencies)
