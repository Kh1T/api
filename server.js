import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";

// Storage config for each type
const imgBasePath = path.join(process.cwd(), "../aeoncommerce/public/img");

const brandStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(imgBasePath, "brand")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(imgBasePath, "category")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(imgBasePath, "product")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const uploadBrand = multer({ storage: brandStorage });
const uploadCategory = multer({ storage: categoryStorage });
const uploadProduct = multer({ storage: productStorage });


dotenv.config();
const app = express();

app.use(cors());            // អនុញ្ញាតឲ្យ frontend call api
app.use(express.json());    // អាន JSON body

// ------------------------
// READ: List all brands
// ------------------------

app.get("/api/brands", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, img FROM brands ORDER BY id DESC");
    res.json(rows);   // ផ្ញើ JSON ទៅ frontend
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// CREATE: Add a new brand
// ------------------------
app.post("/api/brands", uploadBrand.single("img"), async (req, res) => {
  const { name } = req.body;
  const imgPath = req.file ? `./img/brand/${req.file.filename}` : req.body.img || "";
  if (!name) return res.status(400).json({ error: "Missing required fields" });
  try {
    const [result] = await pool.query(
      "INSERT INTO brands (name, img) VALUES (?, ?)",
      [name, imgPath]
    );
    res.json({ id: result.insertId, name, img: imgPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// UPDATE: Update a brand
// ------------------------
app.put("/api/brands/:id", async (req, res) => {
  const { id } = req.params;
  const { name, img } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE brands SET name=?, img=? WHERE id=?",
      [name, img, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Brand not found" });
    }
    res.json({ id, name, img });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// DELETE: Delete a brand
// ------------------------
app.delete("/api/brands/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM brands WHERE id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Brand not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: List all categories
// ------------------------

app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, img FROM categories ORDER BY id DESC");
    res.json(rows);   // ផ្ញើ JSON ទៅ frontend
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ------------------------
// CREATE: Add a new category
// ------------------------
app.post("/api/categories", uploadCategory.single("img"), async (req, res) => {
  const { name } = req.body;
  const imgPath = req.file ? `./img/category/${req.file.filename}` : req.body.img || "";
  if (!name) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO categories (name, img) VALUES (?, ?)",
      [name, imgPath]
    );
    res.json({ id: result.insertId, name, img: imgPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: Update a category (with image upload)
app.put("/api/categories/:id", uploadCategory.single("img"), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const imgPath = req.file ? `./img/category/${req.file.filename}` : req.body.img || "";
  try {
    const [result] = await pool.query(
      "UPDATE categories SET name=?, img=? WHERE id=?",
      [name, imgPath, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json({ id, name, img: imgPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// DELETE: Delete a category
// ------------------------
app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM categories WHERE id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: List all Product
// ------------------------

app.get("/api/product", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.img, p.price, p.category_id, p.brand_id,
             c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `);
    res.json(rows);   // ផ្ញើ JSON ទៅ frontend
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  // ------------------------
  // CREATE: Add a new product
  // ------------------------
  app.post("/api/product", uploadProduct.single("img"), async (req, res) => {
  const { name, price, category_id, brand_id } = req.body;
  const imgPath = req.file ? `./img/product/${req.file.filename}` : req.body.img || "";
  if (!name || !price || !category_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO products (name, brand_id, img, price, category_id) VALUES (?, ?, ?, ?, ?)",
      [name, brand_id || null, imgPath, price, category_id]
    );
    res.json({ id: result.insertId, name, brand_id, img: imgPath, price, category_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  
  // ------------------------
  // UPDATE: Update a product
  // ------------------------
  app.put("/api/product/:id", uploadProduct.single("img"), async (req, res) => {
  const { id } = req.params;
  const { name, price, category_id, brand_id } = req.body;
  const imgPath = req.file ? `./img/product/${req.file.filename}` : req.body.img || "";
  try {
    const [result] = await pool.query(
      "UPDATE products SET name=?, brand_id=?, img=?, price=?, category_id=? WHERE id=?",
      [name, brand_id || null, imgPath, price, category_id, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ id, name, brand_id, img: imgPath, price, category_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  
  // ------------------------
  // DELETE: Delete a product
  // ------------------------
  app.delete("/api/product/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await pool.query("DELETE FROM products WHERE id=?", [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Add search product API endpoint
app.get("/api/product/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }
  
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.img, p.price, p.category_id, p.brand_id,
             c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.name LIKE ?
      ORDER BY p.id DESC
    `, [`%${q}%`]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login API endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  
  try {
    // Check if user exists
    const [users] = await pool.query(
      "SELECT id, username, password, role FROM users WHERE username = ?",
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    const user = users[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ------------------------
// CUSTOMERS: Register a new customer
// ------------------------
app.post("/api/register", async (req, res) => {
  const { name, email, phone, address, username, password } = req.body;
  
  // Validate required fields
  if (!name || !email || !phone || !address || !username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  
  try {
    // Check if username already exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }
    
    // Check if email already exists
    const [existingCustomers] = await pool.query(
      "SELECT id FROM customers WHERE email = ?",
      [email]
    );
    
    if (existingCustomers.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Start transaction
    await pool.query("START TRANSACTION");
    
    try {
      // Insert customer
      const [customerResult] = await pool.query(
        "INSERT INTO customers (name, email, phone, address, created_at) VALUES (?, ?, ?, ?, NOW())",
        [name, email, phone, address]
      );
      
      const customerId = customerResult.insertId;
      
      // Insert user with customer role
      await pool.query(
        "INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)",
        [customerId, username, hashedPassword, 'customer']
      );
      
      // Commit transaction
      await pool.query("COMMIT");
      
      res.json({
        id: customerId,
        username,
        role: 'customer',
        message: "Registration successful"
      });
    } catch (err) {
      // Rollback transaction
      await pool.query("ROLLBACK");
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// CUSTOMERS: List all customers
// ------------------------

app.get("/api/customers", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, phone, address, created_at FROM customers ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// CUSTOMERS: Add a new customer
// ------------------------
app.post("/api/customers", async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const [result] = await pool.query(
      "INSERT INTO customers (name, email, phone, address, created_at) VALUES (?, ?, ?, ?, NOW())",
      [name, email, phone, address]
    );
    res.json({ id: result.insertId, name, email, phone, address, created_at: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// CUSTOMERS: Update a customer
// ------------------------
app.put("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE customers SET name=?, email=?, phone=?, address=? WHERE id=?",
      [name, email, phone, address, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    // Get updated customer data
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, address, created_at FROM customers WHERE id=?",
      [id]
    );
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// CUSTOMERS: Delete a customer
// ------------------------
app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM customers WHERE id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// ORDERS: List all orders
// ------------------------

app.get("/api/orders", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.customer_id, c.name as customer_name, o.total_amount, o.status, o.order_date
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// ORDERS: Get orders by customer ID
// ------------------------
app.get("/api/orders/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const [rows] = await pool.query(`
      SELECT o.id, o.customer_id, o.total_amount, o.status, o.order_date
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.order_date DESC
    `, [customerId]);
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// ORDERS: Get order with items
// ------------------------
app.get("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order details
    const [orderRows] = await pool.query(`
      SELECT o.id, o.customer_id, c.name as customer_name, c.email, c.phone, c.address,
             o.total_amount, o.status, o.order_date
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const order = orderRows[0];
    
    // Get order items
    const [itemRows] = await pool.query(`
      SELECT oi.id, oi.product_id, p.name as product_name, oi.quantity, oi.price
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    
    order.items = itemRows;
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------------
// ORDERS: Update an order
// ------------------------
app.put("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { customer_id, total_amount, status } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE orders SET customer_id=?, total_amount=?, status=? WHERE id=?",
      [customer_id, total_amount, status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ id, customer_id, total_amount, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// ORDERS: Delete an order
// ------------------------
app.delete("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Delete order items first
    await pool.query("DELETE FROM order_items WHERE order_id=?", [id]);
    
    // Delete order
    const [result] = await pool.query("DELETE FROM orders WHERE id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// PRODUCT DETAILS: List all details for a product
// ------------------------
app.get("/api/product/:productId/details", async (req, res) => {
  try {
    const { productId } = req.params;
    const [rows] = await pool.query(
      "SELECT id, detail_name, detail_value FROM product_details WHERE product_id = ? ORDER BY id",
      [productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// PRODUCT DETAILS: Add a new detail
// ------------------------
app.post("/api/product/:productId/details", async (req, res) => {
  const { productId } = req.params;
  const { detail_name, detail_value } = req.body;
  if (!detail_name) return res.status(400).json({ error: "Detail name is required" });
  try {
    const [result] = await pool.query(
      "INSERT INTO product_details (product_id, detail_name, detail_value) VALUES (?, ?, ?)",
      [productId, detail_name, detail_value]
    );
    res.json({ id: result.insertId, product_id: productId, detail_name, detail_value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// PRODUCT DETAILS: Update a detail
// ------------------------
app.put("/api/product-details/:id", async (req, res) => {
  const { id } = req.params;
  const { detail_name, detail_value } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE product_details SET detail_name=?, detail_value=? WHERE id=?",
      [detail_name, detail_value, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product detail not found" });
    }
    res.json({ id, detail_name, detail_value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// PRODUCT DETAILS: Delete a detail
// ------------------------
app.delete("/api/product-details/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM product_details WHERE id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product detail not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// ORDERS: Create a new order
// ------------------------
app.post("/api/orders", async (req, res) => {
  const { customer_id, total_amount, status, items } = req.body;
  
  // Validate required fields
  if (!customer_id || !total_amount || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  // Validate items
  for (const item of items) {
    if (!item.product_id || !item.quantity || !item.price) {
      return res.status(400).json({ error: "Each item must have product_id, quantity, and price" });
    }
  }
  
  try {
    // Start a transaction
    await pool.query("START TRANSACTION");
    
    // Insert order
    const [orderResult] = await pool.query(
      "INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)",
      [customer_id, total_amount, status || 'pending']
    );
    
    const orderId = orderResult.insertId;
    
    // Insert order items
    for (const item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.product_id, item.quantity, item.price]
      );
    }
    
    // Commit transaction
    await pool.query("COMMIT");
    
    // Fetch the created order with details
    const [orderRows] = await pool.query(`
      SELECT o.id, o.customer_id, o.total_amount, o.status, o.order_date,
             c.name as customer_name, c.email, c.phone, c.address
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [orderId]);
    
    const order = orderRows[0];
    
    // Fetch order items
    const [itemRows] = await pool.query(`
      SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);
    
    order.items = itemRows;
    
    res.json(order);
  } catch (err) {
    // Rollback transaction on error
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get a single product with details
// ------------------------
app.get("/api/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product details
    const [productRows] = await pool.query(`
      SELECT p.id, p.name, p.img, p.price, p.category_id, p.brand_id,
             c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?
    `, [id]);
    
    if (productRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const product = productRows[0];
    
    // Get product details
    const [detailRows] = await pool.query(
      "SELECT id, detail_name, detail_value FROM product_details WHERE product_id = ? ORDER BY id",
      [id]
    );
    
    product.details = detailRows;
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get order statistics
// ------------------------
app.get("/api/orders/stats", async (req, res) => {
  try {
    // Get total orders
    const [totalOrders] = await pool.query("SELECT COUNT(*) as count FROM orders");
    
    // Get orders by status
    const [ordersByStatus] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);
    
    // Get recent orders (last 7 days)
    const [recentOrders] = await pool.query(`
      SELECT DATE(order_date) as date, COUNT(*) as count
      FROM orders
      WHERE order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(order_date)
      ORDER BY date
    `);
    
    // Get total sales
    const [totalSales] = await pool.query(`
      SELECT SUM(total_amount) as totalSales
      FROM orders
      WHERE status = 'delivered' OR status = 'shipped'
    `);
    
    // Get top selling products
    const [topProducts] = await pool.query(`
      SELECT p.id, p.name, p.img, SUM(oi.quantity) as totalSold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered' OR o.status = 'shipped'
      GROUP BY p.id, p.name, p.img
      ORDER BY totalSold DESC
      LIMIT 5
    `);
    
    // Get sales by month
    const [salesByMonth] = await pool.query(`
      SELECT
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(total_amount) as sales
      FROM orders
      WHERE status = 'delivered' OR status = 'shipped'
      GROUP BY month
      ORDER BY month
      LIMIT 6
    `);
    
    res.json({
      totalOrders: totalOrders[0].count,
      ordersByStatus,
      recentOrders,
      totalSales: totalSales[0].totalSales || 0,
      topProducts,
      salesByMonth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get customer statistics
// ------------------------
app.get("/api/customers/stats", async (req, res) => {
  try {
    // Get total customers
    const [totalCustomers] = await pool.query("SELECT COUNT(*) as count FROM customers");
    
    // Get new customers (last 30 days)
    const [newCustomers] = await pool.query(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    // Get customers by order count
    const [customersByOrderCount] = await pool.query(`
      SELECT
        CASE
          WHEN order_count = 0 THEN 'No Orders'
          WHEN order_count BETWEEN 1 AND 2 THEN '1-2 Orders'
          WHEN order_count BETWEEN 3 AND 5 THEN '3-5 Orders'
          ELSE '5+ Orders'
        END as category,
        COUNT(*) as count
      FROM (
        SELECT c.id, COUNT(o.id) as order_count
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        GROUP BY c.id
      ) customer_orders
      GROUP BY category
    `);
    
    res.json({
      totalCustomers: totalCustomers[0].count,
      newCustomers: newCustomers[0].count,
      customersByOrderCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get product statistics
// ------------------------
app.get("/api/products/stats", async (req, res) => {
  try {
    // Get total products
    const [totalProducts] = await pool.query("SELECT COUNT(*) as count FROM products");
    
    // Get products by category
    const [productsByCategory] = await pool.query(`
      SELECT c.name as category, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);
    
    // Get products by brand
    const [productsByBrand] = await pool.query(`
      SELECT b.name as brand, COUNT(p.id) as count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id
      GROUP BY b.id, b.name
      ORDER BY count DESC
      LIMIT 5
    `);
    
    res.json({
      totalProducts: totalProducts[0].count,
      productsByCategory,
      productsByBrand
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get user statistics
// ------------------------
app.get("/api/users/stats", async (req, res) => {
  try {
    // Get total users
    const [totalUsers] = await pool.query("SELECT COUNT(*) as count FROM users");
    
    // Get users by role
    const [usersByRole] = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    
    res.json({
      totalUsers: totalUsers[0].count,
      usersByRole
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get customer statistics
// ------------------------
app.get("/api/customers/stats", async (req, res) => {
  try {
    // Get total customers
    const [totalCustomers] = await pool.query("SELECT COUNT(*) as count FROM customers");
    
    // Get new customers (registered in the last 30 days)
    const [newCustomers] = await pool.query(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    // Get customers by order count
    const [customersByOrderCount] = await pool.query(`
      SELECT
        CASE
          WHEN order_count = 0 THEN 'No Orders'
          WHEN order_count = 1 THEN 'One Order'
          WHEN order_count BETWEEN 2 AND 5 THEN '2-5 Orders'
          ELSE 'Frequent Buyer'
        END as category,
        COUNT(*) as count
      FROM (
        SELECT c.id, COUNT(o.id) as order_count
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        GROUP BY c.id
      ) customer_orders
      GROUP BY category
      ORDER BY
        CASE category
          WHEN 'No Orders' THEN 1
          WHEN 'One Order' THEN 2
          WHEN '2-5 Orders' THEN 3
          ELSE 4
        END
    `);
    
    res.json({
      totalCustomers: totalCustomers[0].count,
      newCustomers: newCustomers[0].count,
      customersByOrderCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get all users
// ------------------------
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, username, role FROM users ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get inventory statistics
// ------------------------
app.get("/api/inventory/stats", async (req, res) => {
  try {
    // Get total inventory value
    const [totalValue] = await pool.query(`
      SELECT SUM(p.price * 100) as totalValue
      FROM products p
    `);
    
    // Get products by price range
    const [productsByPriceRange] = await pool.query(`
      SELECT
        CASE
          WHEN price < 10 THEN 'Under $10'
          WHEN price BETWEEN 10 AND 50 THEN '$10-$50'
          WHEN price BETWEEN 50 AND 100 THEN '$50-$100'
          ELSE 'Over $100'
        END as priceRange,
        COUNT(*) as count
      FROM products
      GROUP BY priceRange
      ORDER BY
        CASE priceRange
          WHEN 'Under $10' THEN 1
          WHEN '$10-$50' THEN 2
          WHEN '$50-$100' THEN 3
          ELSE 4
        END
    `);
    
    // Get low stock products (less than 10 items)
    const [lowStockProducts] = await pool.query(`
      SELECT COUNT(*) as count
      FROM products
      WHERE price < 10
    `);
    
    res.json({
      totalValue: totalValue[0].totalValue || 0,
      productsByPriceRange,
      lowStockProducts: lowStockProducts[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get product statistics
// ------------------------
app.get("/api/products/stats", async (req, res) => {
  try {
    // Get total products
    const [totalProducts] = await pool.query("SELECT COUNT(*) as count FROM products");
    
    // Get products by category
    const [productsByCategory] = await pool.query(`
      SELECT c.name as category, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);
    
    // Get products by brand
    const [productsByBrand] = await pool.query(`
      SELECT b.name as brand, COUNT(p.id) as count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id
      GROUP BY b.id, b.name
      ORDER BY count DESC
      LIMIT 5
    `);
    
    res.json({
      totalProducts: totalProducts[0].count,
      productsByCategory,
      productsByBrand
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get dashboard statistics
// ------------------------
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    // Get counts for each entity
    const [products] = await pool.query("SELECT COUNT(*) as count FROM products");
    const [brands] = await pool.query("SELECT COUNT(*) as count FROM brands");
    const [categories] = await pool.query("SELECT COUNT(*) as count FROM categories");
    const [customers] = await pool.query("SELECT COUNT(*) as count FROM customers");
    const [orders] = await pool.query("SELECT COUNT(*) as count FROM orders");
    
    res.json({
      products: products[0].count,
      brands: brands[0].count,
      categories: categories[0].count,
      customers: customers[0].count,
      orders: orders[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// READ: Get order statistics
// ------------------------
app.get("/api/orders/stats", async (req, res) => {
  try {
    // Get total sales
    const [totalSalesResult] = await pool.query(`
      SELECT SUM(total_amount) as totalSales
      FROM orders
      WHERE status = 'delivered'
    `);
    
    const totalSales = totalSalesResult[0].totalSales || 0;
    
    // Get orders by status
    const [ordersByStatus] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);
    
    // Get top selling products
    const [topProducts] = await pool.query(`
      SELECT p.id, p.name, p.img, SUM(oi.quantity) as totalSold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
      GROUP BY p.id, p.name, p.img
      ORDER BY totalSold DESC
      LIMIT 5
    `);
    
    // Get sales by month (last 6 months)
    const [salesByMonth] = await pool.query(`
      SELECT
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(total_amount) as sales
      FROM orders
      WHERE status = 'delivered'
        AND order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(order_date, '%Y-%m')
      ORDER BY month
    `);
    
    res.json({
      totalSales,
      ordersByStatus,
      topProducts,
      salesByMonth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// Run server
// ------------------------

const PORT = process.env.PORT || 4000;
// console.log (process.env.DB_PORT);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));