
import pkg from "pg";
const {Pool}=pkg;

export const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:{rejectUnauthorized:false}
});

export const query=(text,params)=>pool.query(text,params);
