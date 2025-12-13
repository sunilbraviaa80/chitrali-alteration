// backend/index.js
import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";
import uploadRouter from "./routes/upload.js";

const app = express();

app.use(cors());

// Keep JSON limits small (images must NOT come here)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/alterations", alterationsRouter);
app.use("/upload", uploadRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
