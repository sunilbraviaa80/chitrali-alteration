import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";
import uploadRouter from "./routes/upload.js";

const app = express();

app.use(cors());

// Safety limits (images must NOT be JSON)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Upload route (multipart only)
app.use("/upload", uploadRouter);

// CRUD route
app.use("/alterations", alterationsRouter);

// Friendly 413 handler
app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Payload too large. Upload image via /upload."
    });
  }
  next(err);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
