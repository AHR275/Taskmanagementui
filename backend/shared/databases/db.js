// import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: "../../process.env" });
import pkg from "pg";
const { Pool } = pkg;

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// server/ is one level under backend/, so go up one:
const envPath = resolve(__dirname, "../../process.env");

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("❌ Failed to load env file:", envPath);
  console.error(result.error);
} else {
  console.log("✅ Loaded env file:", envPath);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

export default pool;