import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

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

async function createSampleUsers() {
  try {
    console.log("Attempting to connect with:");
    console.log("Host:", process.env.DB_HOST);
    console.log("User:", process.env.DB_USER);
    console.log("Database:", process.env.DB_NAME);
    console.log("Port:", process.env.DB_PORT);
    
    // Get a connection from the pool
    const connection = await pool.getConnection();
    console.log("✅ Database connection successful!");
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    
    // Insert sample users
    const sampleUsers = [
      {
        username: 'admin',
        password: adminPassword,
        email: 'admin@aeoncommerce.com',
        role: 'admin',
        name: 'Admin User',
        phone: '123-456-7890',
        address: 'Admin Address'
      },
      {
        username: 'user',
        password: userPassword,
        email: 'user@aeoncommerce.com',
        role: 'customer', // Changed from 'user' to 'customer'
        name: 'Customer User',
        phone: '098-765-4321',
        address: 'Customer Address'
      }
    ];
    
    for (const user of sampleUsers) {
      // Check if user already exists
      const [existingUsers] = await connection.query(
        "SELECT id FROM users WHERE username = ?",
        [user.username]
      );
      
      if (existingUsers.length > 0) {
        console.log(`User ${user.username} already exists, updating...`);
        await connection.query(
          "UPDATE users SET password = ?, email = ?, role = ? WHERE username = ?",
          [user.password, user.email, user.role, user.username]
        );
        
        // If this is the customer user, also update the customer record
        if (user.role === 'customer') {
          const [userRecord] = await connection.query(
            "SELECT id FROM users WHERE username = ?",
            [user.username]
          );
          
          if (userRecord.length > 0) {
            const userId = userRecord[0].id;
            await connection.query(
              "UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?",
              [user.name, user.email, user.phone, user.address, userId]
            );
          }
        }
      } else {
        if (user.role === 'customer') {
          // For customer users, first insert into customers table
          console.log(`Creating customer record for ${user.username}...`);
          const [customerResult] = await connection.query(
            "INSERT INTO customers (name, email, phone, address, created_at) VALUES (?, ?, ?, ?, NOW())",
            [user.name, user.email, user.phone, user.address]
          );
          
          const customerId = customerResult.insertId;
          
          // Then insert into users table with the same ID
          console.log(`Creating user ${user.username}...`);
          await connection.query(
            "INSERT INTO users (id, username, password, email, role) VALUES (?, ?, ?, ?, ?)",
            [customerId, user.username, user.password, user.email, user.role]
          );
        } else {
          // For admin users, just insert into users table
          console.log(`Creating user ${user.username}...`);
          await connection.query(
            "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
            [user.username, user.password, user.email, user.role]
          );
        }
      }
    }
    
    console.log("✅ Sample users created/updated successfully!");
    
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

createSampleUsers();