const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/admin/users - все пользователи
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, phone, country_code, full_name, is_online, created_at FROM users'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/chats - все чаты
router.get('/chats', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chats ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/messages/:chatId - сообщения чата
router.get('/messages/:chatId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.params.chatId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;