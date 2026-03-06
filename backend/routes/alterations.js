
import express from "express";
import {query} from "../db.js";

const router=express.Router();

router.get("/",async(req,res)=>{
 const r=await query("select * from alterations order by id desc");
 res.json(r.rows);
});

router.post("/",async(req,res)=>{
 const {billNumber,tailorName,itemName,imageUrl,thumbUrl}=req.body;

 const r=await query(
 `insert into alterations(bill_number,tailor_name,item_name,image_url,thumb_url)
  values($1,$2,$3,$4,$5) returning *`,
 [billNumber,tailorName,itemName,imageUrl,thumbUrl]
 );

 res.json(r.rows[0]);
});

export default router;
