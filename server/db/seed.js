const pool = require('../config/database');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // 1. Создаем пользователей (если нет)
    // Пользователь 1 = мы (текущий залогиненный)
    // Пользователь 2 = Павел Дуров (тестовый)
    await pool.query(
      `INSERT INTO users (id, username, phone, password_hash) 
       VALUES (2, 'Павел Дуров', '+79991112233', '$2a$10$dummyhashfortesting')
       ON CONFLICT (id) DO NOTHING`
    );

    // 2. Создаем чаты
    const chats = [
      { name: 'Павел Дуров', type: 'private', participants: [1, 2] },
      { name: 'React Developers', type: 'group', participants: [1, 2, 3] },
      { name: 'Мама', type: 'private', participants: [1, 4] }
    ];

    for (const chatData of chats) {
      // Проверяем, есть ли чат
      const existing = await pool.query('SELECT id FROM chats WHERE name = $1', [chatData.name]);
      
      let chatId;
      if (existing.rows.length === 0) {
        const newChat = await pool.query(
          'INSERT INTO chats (type, name, created_by) VALUES ($1, $2, $3) RETURNING id',
          [chatData.type, chatData.name, 1]
        );
        chatId = newChat.rows[0].id;
      } else {
        chatId = existing.rows[0].id;
      }

      // Добавляем участников
      for (const participantId of chatData.participants) {
        await pool.query(
          'INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [chatId, participantId]
        );
      }

      // Добавляем тестовые сообщения (если чат пуст)
      const msgCheck = await pool.query('SELECT id FROM messages WHERE chat_id = $1', [chatId]);
      if (msgCheck.rows.length === 0) {
        await pool.query(
          'INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3)',
          [chatId, chatData.participants[1] || 2, `Привет! Это тестовое сообщение в чате "${chatData.name}"`]
        );
        await pool.query(
          'INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3)',
          [chatId, 1, 'Отлично, всё работает! 🚀']
        );
      }
    }

    console.log('🎉 Seeding finished!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();