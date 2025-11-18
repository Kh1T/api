import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the api directory
dotenv.config({ path: path.join(__dirname, ".env") });

// បង្កើត connection pool ទៅ MySQL
export const pool = mysql.createPool({
  host: process.env.DB_HOST,         // អានពី .env
  user: process.env.DB_USER,         // អានពី .env
  password: process.env.DB_PASS,     // អានពី .env
  database: process.env.DB_NAME,     // អានពី .env
  port: process.env.DB_PORT || 3306, // Use DB_PORT or default to 3306
  waitForConnections: true,          // Queue connection
  connectionLimit: 10                // ចំនួន connection អតិបរមា
});