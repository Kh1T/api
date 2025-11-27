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
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
});

async function addCreatedAtColumn() {
  try {
    console.log("Attempting to connect with:");
    console.log("Host:", process.env.DB_HOST);
    console.log("User:", process.env.DB_USER);
    console.log("Database:", process.env.DB_NAME);
    console.log("Port:", process.env.DB_PORT);
    
    // Get a connection from the pool
    const connection = await pool.getConnection();
    console.log("✅ Database connection successful!");
    
    // Check if created_at column exists
    const [columns] = await connection.query('DESCRIBE customers');
    const hasCreatedAt = columns.some(col => col.Field === 'created_at');
    
    if (!hasCreatedAt) {
      console.log('Adding created_at column to customers table...');
      await connection.query('ALTER TABLE customers ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      console.log('✅ created_at column added successfully!');
    } else {
      console.log('✅ created_at column already exists in customers table.');
    }
    
    // Release the connection back to the pool
    connection.release();
    
    // Close the pool
    await pool.end();
    console.log("✅ Database connection closed successfully!");
  } catch (error) {
    console.error("❌ Database operation failed:", error.message);
    console.error("Error details:", error);
  }
}

addCreatedAtColumn();