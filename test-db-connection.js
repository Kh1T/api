import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the api directory
dotenv.config({ path: path.join(__dirname, ".env") });

// Create pool with loaded environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // Default to 3306 if not specified
  waitForConnections: true,
  connectionLimit: 10
});

async function testConnection() {
  try {
    console.log("Attempting to connect with:");
    console.log("Host:", process.env.DB_HOST);
    console.log("User:", process.env.DB_USER);
    console.log("Database:", process.env.DB_NAME);
    console.log("Port:", process.env.DB_PORT);
    
    // Get a connection from the pool
    const connection = await pool.getConnection();
    console.log("✅ Database connection successful!");
    
    // Test with a simple query
    const [rows] = await connection.query("SELECT 1 as connection_test");
    console.log("✅ Database query successful:", rows);
    
    // Release the connection back to the pool
    connection.release();
    
    // Close the pool
    await pool.end();
    console.log("✅ Database connection test completed successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Error details:", error);
  }
}

testConnection();