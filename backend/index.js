// backend/index.js
import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Main API
app.use("/alterations", alterationsRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
