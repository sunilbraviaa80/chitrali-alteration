
import express from "express";
import multer from "multer";
import {v4 as uuidv4} from "uuid";
import {supabase} from "../config/supabase.js";
import {processImage} from "../utils/imageProcessor.js";

const router=express.Router();
const upload=multer({storage:multer.memoryStorage()});
const bucket=process.env.SUPABASE_BUCKET||"alteration-images";

router.post("/",upload.single("image"),async(req,res)=>{
 try{
  const {main,thumb}=await processImage(req.file.buffer);
  const id=uuidv4();
  const mainPath=`${id}.jpg`;
  const thumbPath=`${id}_thumb.jpg`;

  await supabase.storage.from(bucket).upload(mainPath,main,{contentType:"image/jpeg"});
  await supabase.storage.from(bucket).upload(thumbPath,thumb,{contentType:"image/jpeg"});

  const mainUrl=supabase.storage.from(bucket).getPublicUrl(mainPath).data.publicUrl;
  const thumbUrl=supabase.storage.from(bucket).getPublicUrl(thumbPath).data.publicUrl;

  res.json({imageUrl:mainUrl,thumbUrl});
 }catch(e){
  res.status(500).json({error:e.message});
 }
});

export default router;
