import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the api directory
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("Environment Variables:");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);

console.log("\nChecking for trailing spaces:");
console.log("DB_USER length:", process.env.DB_USER?.length);
console.log("DB_PASS length:", process.env.DB_PASS?.length);
console.log("DB_HOST length:", process.env.DB_HOST?.length);