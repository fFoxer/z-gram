const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/database');

// GET /api/chats - Получить список чатов
// GET /api/chats - Получить список чатов пользователя
// GET /api/chats - Получить список чатов пользователя
// GET /api/chats - Получить список чатов пользователя
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
        c.id,
        c.type,
        c.created_at,
        -- Название: для приватных чатов — имя собеседника
        CASE
          WHEN c.type = 'private' THEN (
            SELECT COALESCE(u.full_name, u.username, 'Пользователь')
            FROM users u
            JOIN chat_participants cp2 ON u.id = cp2.user_id
            WHERE cp2.chat_id = c.id AND cp2.user_id != $1
            LIMIT 1
          )
          ELSE c.name
        END as name,
        -- Аватар: для приватных чатов — аватар собеседника
        CASE
          WHEN c.type = 'private' THEN (
            SELECT u.avatar_url
            FROM users u
            JOIN chat_participants cp2 ON u.id = cp2.user_id
            WHERE cp2.chat_id = c.id AND cp2.user_id != $1
            LIMIT 1
          )
          ELSE c.avatar_url
        END as avatar_url,
        -- ID собеседника для приватного чата
        CASE
          WHEN c.type = 'private' THEN (
            SELECT u.id
            FROM users u
            JOIN chat_participants cp2 ON u.id = cp2.user_id
            WHERE cp2.chat_id = c.id AND cp2.user_id != $1
            LIMIT 1
          )
          ELSE NULL
        END as user_id,
        
        (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        
        -- ✅ НОВОЕ: Счетчик непрочитанных
        COALESCE(cp.unread_count, 0) as unread_count
        
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = $1
      ORDER BY last_message_time DESC NULLS LAST`,
      [userId]
    );

    // ... маппинг (оставь как было, но добавь unread)
    const chats = result.rows.map(chat => ({
      id: chat.id,
      name: chat.name || 'Без названия',
      avatar: chat.avatar_url,
      type: chat.type,
      userId: chat.user_id || null,
      last_message: chat.last_message || 'Нет сообщений',
      time: chat.last_message_time 
        ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
      unread: parseInt(chat.unread_count) || 0 // ✅ Добавляем в объект
    }));

    res.json(chats);
  } catch (error) {
    console.error('❌ Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/chats/:chatId/messages - Получить сообщения чата
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await pool.query(
      'SELECT id, sender_id, content, file_url, type, duration, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [chatId]
    );

    const messages = result.rows.map(msg => ({
      id: msg.id,
      sender_id: msg.sender_id,
      content: msg.content,
      file_url: msg.file_url,
      type: msg.type || 'text',
      duration: msg.duration, // ✅ обязательно верни
      time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_mine: false
    }));

    res.json(messages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const myId = req.user.id;

    // Проверяем существующий чат
    const existing = await pool.query(
      `SELECT c.id FROM chats c
       JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = $1
       JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = $2
       WHERE c.type = 'private'`,
      [myId, userId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // Создаём чат (name не важен, будет браться динамически)
    const newChat = await pool.query(
      'INSERT INTO chats (type, name, created_by) VALUES ($1, $2, $3) RETURNING id',
      ['private', 'private_chat', myId] // name = заглушка
    );
    const chatId = newChat.rows[0].id;

    await pool.query(
      'INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
      [chatId, myId, userId]
    );

    res.status(201).json({ id: chatId });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ POST /api/chats/group - Создать группу
router.post('/group', authMiddleware, async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    const myId = req.user.id;

    if (!name || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ message: 'Укажите название и участников' });
    }

    const allParticipants = [myId, ...participantIds.filter(id => id !== myId)];

    // Создаём чат
    const chatRes = await pool.query(
      'INSERT INTO chats (type, name, created_by) VALUES ($1, $2, $3) RETURNING id',
      ['group', name, myId]
    );
    const chatId = chatRes.rows[0].id;

    // Добавляем участников
    const values = allParticipants.map((_, idx) => `($1, $${idx + 2})`).join(',');
    await pool.query(`INSERT INTO chat_participants (chat_id, user_id) VALUES ${values}`, [chatId, ...allParticipants]);

    res.status(201).json({ id: chatId, name });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/chats/:chatId/participants - Получить участников группы
router.get('/:chatId/participants', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await pool.query(`
      SELECT u.id, u.username, u.full_name, u.avatar_url 
      FROM users u 
      JOIN chat_participants cp ON u.id = cp.user_id 
      WHERE cp.chat_id = $1
    `, [chatId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ POST /api/chats/:chatId/participants - Добавить участника
router.post('/:chatId/participants', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    // Проверка: текущий пользователь уже в чате
    const isMember = await pool.query('SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2', [chatId, req.user.id]);
    if (isMember.rows.length === 0) return res.status(403).json({ message: 'Вы не участник этого чата' });

    // Проверка: пользователь уже в чате
    const exists = await pool.query('SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2', [chatId, userId]);
    if (exists.rows.length > 0) return res.status(400).json({ message: 'Уже в группе' });

    await pool.query('INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)', [chatId, userId]);
    
    // Уведомляем участников через сокет
    req.app.get('io').to(`chat_${chatId}`).emit('participant_added', { chatId, userId });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;