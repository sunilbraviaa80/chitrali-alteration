import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";
import uploadRouter from "./routes/upload.js";

const app = express();

app.use(cors());

// ✅ Increase JSON limits (safety net). Images should still NOT be sent in JSON.
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

// ✅ multipart route
app.use("/upload", uploadRouter);

// ✅ JSON CRUD
app.use("/alterations", alterationsRouter);

// ✅ 413 handler (covers JSON)
app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Payload too large. Please upload the image via /upload (multipart/form-data).",
    });
  }
  next(err);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
