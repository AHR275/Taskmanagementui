import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
// import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// import { fileURLToPath } from "url";

// const Pool = POOL.Pool; 

// needed if you're using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../process.env"),
});


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
