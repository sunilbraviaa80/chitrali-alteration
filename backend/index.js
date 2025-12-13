import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";
import uploadRouter from "./routes/upload.js";

const app = express();

app.use(cors());

// ✅ Keep JSON limits small (images must NOT come through JSON)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

// ✅ Upload route uses multipart/form-data (multer)
app.use("/upload", uploadRouter);

// ✅ Normal CRUD (JSON only, no image file)
app.use("/alterations", alterationsRouter);

// ✅ Friendly error message if someone still sends a huge JSON payload
app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Payload too large. Upload image via /upload (multipart/form-data), not JSON.",
    });
  }
  next(err);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
