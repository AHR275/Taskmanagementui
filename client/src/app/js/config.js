// import POOL  from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// import { fileURLToPath } from "url";

// const Pool = POOL.Pool; 

// needed if you're using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../process.env"),
});


const SERVER_URL = JSON.parse(process.env.VITE_API_URL);
// console.log(dbConfig);
// const pool = new Pool(dbConfig);



export  {SERVER_URL}; 