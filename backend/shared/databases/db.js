import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Load .env from project root (adjust if needed)
  dotenv.config({
    path: path.resolve(__dirname, "../../process.env"),
  });

  if(!process.env.DATABASE_URL){

    throw new Error("DATABASE_URL is not set");
  }
  
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export default pool;
