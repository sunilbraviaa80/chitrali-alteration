
import sharp from "sharp";

export async function processImage(buffer){
 const main=await sharp(buffer).resize({width:1600}).jpeg({quality:75}).toBuffer();
 const thumb=await sharp(buffer).resize({width:300}).jpeg({quality:65}).toBuffer();
 return {main,thumb};
}
