import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";
import uploadRouter from "./routes/upload.js";

const app = express();

const corsOptions = {
  origin: [
    "https://chitrali-alteration-1.onrender.com",
    "https://chitrali-alteration.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "x-user-role"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/upload", uploadRouter);
app.use("/alterations", alterationsRouter);

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Payload too large. Please upload the image via /upload (multipart/form-data).",
    });
  }
  next(err);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
