const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

module.exports = router;