import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";
import uploadRouter from "./routes/upload.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));


// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Upload + API
app.use("/upload", uploadRouter);
app.use("/alterations", alterationsRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
