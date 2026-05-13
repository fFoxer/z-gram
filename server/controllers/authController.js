const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const generateTokens = require('../utils/generateTokens');

// Регистрация
exports.register = async (req, res) => {
  try {
    const { username, phone, password, country_code, full_name } = req.body;
    const existingUser = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existingUser.rows.length > 0) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (username, phone, password_hash, country_code, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, phone, passwordHash, country_code || '+7', full_name || username]
    );

    const tokens = generateTokens(newUser.rows[0]);
    res.status(201).json({ user: newUser.rows[0], ...tokens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Логин
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (user.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const tokens = generateTokens(user.rows[0]);
    res.json({ user: user.rows[0], ...tokens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Logout (должен быть экспортирован через exports)
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};