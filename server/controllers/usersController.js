const pool = require('../config/database');

// Auto-migrate: add birthday column if not exists
pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday VARCHAR(50)").catch(() => {});

// Получить свой профиль
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, phone, full_name, country_code, status,
              avatar_url, birthday, is_online, last_seen
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Обновить профиль
exports.updateMe = async (req, res) => {
  try {
    const { full_name, status, username, birthday } = req.body;
    // Принимаем как avatar, так и avatar_url (фронт может прислать оба варианта)
    const avatar_url = req.body.avatar_url || req.body.avatar || undefined;

    // Проверка уникальности username
    if (username) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, req.user.id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Имя пользователя уже занято' });
      }
    }

    const result = await pool.query(
      `UPDATE users SET
         full_name  = COALESCE($1, full_name),
         status     = COALESCE($2, status),
         avatar_url = COALESCE($3, avatar_url),
         username   = COALESCE($4, username),
         birthday   = COALESCE($5, birthday)
       WHERE id = $6
       RETURNING id, username, phone, full_name, country_code, status,
                 avatar_url, birthday, is_online, last_seen`,
      [full_name, status, avatar_url, username, birthday, req.user.id]
    );

    const updatedUser = result.rows[0];

    // Оповещаем собеседников об изменении имени/аватара через сокет
    const io = req.app.get('io');
    if (io && (full_name || username || avatar_url)) {
      const chats = await pool.query(
        'SELECT chat_id FROM chat_participants WHERE user_id = $1',
        [req.user.id]
      );
      chats.rows.forEach(({ chat_id }) => {
        io.to(`chat_${chat_id}`).emit('user_profile_updated', {
          userId: req.user.id,
          full_name: updatedUser.full_name,
          username: updatedUser.username,
          avatar_url: updatedUser.avatar_url,
        });
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('updateMe error:', error);
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
