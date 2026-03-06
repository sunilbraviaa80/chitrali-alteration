
import express from "express";
import cors from "cors";
import alterationsRouter from "./routes/alterations.js";
import uploadRouter from "./routes/upload.js";

const app = express();
app.use(cors());
app.use(express.json({limit:"20mb"}));

app.get("/health",(req,res)=>res.json({status:"ok"}));

app.use("/upload",uploadRouter);
app.use("/alterations",alterationsRouter);

const PORT=process.env.PORT||10000;
app.listen(PORT,()=>console.log("Server running on",PORT));
