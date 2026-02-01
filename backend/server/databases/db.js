import POOL  from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// import { fileURLToPath } from "url";

const Pool = POOL.Pool; 

// needed if you're using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../process.env"),
});


const dbConfig = JSON.parse(process.env.DB_CONFIG);
// console.log(dbConfig);
const pool = new Pool(dbConfig);



export default pool; 