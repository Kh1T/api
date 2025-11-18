const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  port: 8889,
  user: 'khit',
  password: '',
  database: 'aeoncommerce'
});

router.get('/', (req, res) => {
  connection.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;
