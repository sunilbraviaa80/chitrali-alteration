// backend/server.js
const express = require("express");
const cors = require("cors");
const alterationsRouter = require("./routes/alterations");

const app = express();

app.use(cors());
app.use(express.json());

// Simple health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// API routes
app.use("/alterations", alterationsRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
