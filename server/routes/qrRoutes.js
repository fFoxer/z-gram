const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const redisClient = require('../config/redis');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// Generate QR token (60s TTL)
router.get('/generate', async (req, res) => {
  try {
    const token = randomUUID();
    await redisClient.set(`qr:${token}`, 'pending', { EX: 60 });
    res.json({ token });
  } catch (err) {
    console.error('QR generate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm QR login from authenticated device
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    const val = await redisClient.get(`qr:${token}`);
    if (!val || val !== 'pending') {
      return res.status(400).json({ message: 'QR код недействителен или истёк' });
    }

    const result = await pool.query(
      `SELECT id, username, phone, full_name, country_code, status, avatar_url, is_online, last_seen
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Пользователь не найден' });

    const user = result.rows[0];
    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRE });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE });

    await redisClient.del(`qr:${token}`);

    const io = req.app.get('io');
    io.to(`qr:${token}`).emit('qr_login_success', { accessToken, refreshToken, user });

    res.json({ message: 'OK' });
  } catch (err) {
    console.error('QR confirm error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
