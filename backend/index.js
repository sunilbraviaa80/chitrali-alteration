import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";
import uploadRouter from "./routes/upload.js";

const app = express();

app.use(cors());

// JSON only for normal APIs (small payloads)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Routes
app.use("/alterations", alterationsRouter);
app.use("/upload", uploadRouter); // 👈 image upload route

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
