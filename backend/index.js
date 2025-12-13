// backend/index.js
import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";
import uploadRouter from "./routes/upload.js";

const app = express();

app.use(cors());

// Keep JSON payload small; images must go to /upload (multipart)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Upload endpoint (multipart/form-data)
app.use("/upload", uploadRouter);

// Main data API (JSON)
app.use("/alterations", alterationsRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
