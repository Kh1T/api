import { pool } from './db.js';

const createPaymentMethodsTable = async () => {
  try {
    // Create payment_methods table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Payment methods table created successfully');
    
    // Insert default payment methods
    const defaultPaymentMethods = [
      { name: 'Credit Card', description: 'Pay with credit or debit card' },
      { name: 'Cash on Delivery', description: 'Pay with cash when receiving the order' },
      { name: 'Bank Transfer', description: 'Transfer money directly to our bank account' },
      { name: 'Mobile Payment', description: 'Pay using mobile payment services' }
    ];
    
    for (const method of defaultPaymentMethods) {
      await pool.query(
        'INSERT IGNORE INTO payment_methods (name, description) VALUES (?, ?)',
        [method.name, method.description]
      );
    }
    
    console.log('Default payment methods inserted');
    
    // Add payment_method_id column to orders table
    try {
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN payment_method_id INT DEFAULT NULL,
        ADD FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
      `);
      console.log('Added payment_method_id column to orders table');
    } catch (err) {
      // Column might already exist
      console.log('Payment method column may already exist or error occurred:', err.message);
    }
    
  } catch (err) {
    console.error('Error creating payment methods table:', err);
  } finally {
    await pool.end();
  }
};

createPaymentMethodsTable();