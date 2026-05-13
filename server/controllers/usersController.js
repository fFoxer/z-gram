const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Получить свой профиль
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, phone, full_name, country_code, status, avatar_url, is_online, last_seen FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Обновить профиль
exports.updateMe = async (req, res) => {
  try {
    const { full_name, status, avatar_url } = req.body;
    const result = await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), status = COALESCE($2, status), avatar_url = COALESCE($3, avatar_url) WHERE id = $4 RETURNING *',
      [full_name, status, avatar_url, req.user.id]
    );

    // Оповещаем все активные чаты пользователя об изменении имени
    const chats = await pool.query(
      'SELECT chat_id FROM chat_participants WHERE user_id = $1',
      [req.user.id]
    );

    const io = req.app.get('io'); // Получаем socket.io instance
    chats.rows.forEach(({ chat_id }) => {
      io.to(`chat_${chat_id}`).emit('user_name_updated', {
        userId: req.user.id,
        newName: full_name || result.rows[0].username
      });
    });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Поиск пользователей
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const result = await pool.query(
      `SELECT id, username, full_name, phone, avatar_url, is_online 
       FROM users 
       WHERE (username ILIKE $1 OR full_name ILIKE $1 OR phone ILIKE $1) 
       AND id != $2
       LIMIT 10`,
      [`%${q}%`, req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};