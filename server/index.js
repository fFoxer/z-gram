const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Импорт конфигураций
const pool = require('./config/database');
const redisClient = require('./config/redis');

// Импорт роутов
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/admin');
const usersRoutes = require('./routes/usersRoutes');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Убедись, что папка uploads существует
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Настройка хранилища
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Уникальное имя файла: timestamp + оригинальное имя
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Z-Gram API is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ Глобальная карта онлайн-пользователей (вынесена ИЗ connection)
const onlineUsers = new Map();

// ✅ Socket.io логика (ОДИН обработчик connection, без вложенности!)
const userSockets = new Map(); // userId -> Set<socketId>

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  // Авторизация
  socket.on('authenticate', async (userId) => {
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
    
    if (userSockets.get(userId).size === 1) {
      await pool.query('UPDATE users SET is_online = TRUE WHERE id = $1', [userId]);
      io.emit('user_status_changed', { userId, isOnline: true });
    }
  });

  // Дисконнект (закрытие вкладки)
  socket.on('disconnect', async () => {
    for (const [userId, sockets] of userSockets) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          await pool.query('UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = $1', [userId]);
          io.emit('user_status_changed', { userId, isOnline: false });
        }
        break;
      }
    }
  });

  socket.on('mark_read', async ({ chatId, userId }) => {
    try {
      // Обновляем в БД все сообщения чата, которые НЕ от текущего пользователя и ещё не прочитаны
      await pool.query(
        `UPDATE messages 
         SET is_read = TRUE, read_at = NOW() 
         WHERE chat_id = $1 AND sender_id != $2 AND is_read = FALSE`,
        [chatId, userId]
      );

      // Оповещаем СОБЕСЕДНИКА (отправителя), что его сообщения прочитаны
      // Используем socket.to(), чтобы не отправлять событие самому себе
      socket.to(`chat_${chatId}`).emit('messages_read', { chatId, readerId: userId });
      
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  });

  socket.on('edit_message', async ({ messageId, chatId, newContent, senderId }) => {
    try {
      // Проверяем, что пользователь — автор сообщения
      const msg = await pool.query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
      if (msg.rows[0]?.sender_id !== senderId) {
        return socket.emit('error', { message: 'Недостаточно прав' });
      }

      // Обновляем в БД
      await pool.query(
        'UPDATE messages SET content = $1, is_edited = TRUE, edited_at = NOW() WHERE id = $2',
        [newContent, messageId]
      );

      // Рассылаем обновление всем в чате
      io.to(`chat_${chatId}`).emit('message_edited', {
        id: messageId,
        content: newContent,
        is_edited: true,
        edited_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error editing message:', error);
      socket.emit('error', { message: 'Ошибка при редактировании' });
    }
  });

  // ✅ Удаление сообщения
  socket.on('delete_message', async ({ messageId, chatId, senderId }) => {
    try {
      // Проверяем права (автор или админ чата)
      const msg = await pool.query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
      if (msg.rows[0]?.sender_id !== senderId) {
        return socket.emit('error', { message: 'Недостаточно прав' });
      }

      // Удаляем из БД
      await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);

      // Рассылаем удаление всем в чате
      io.to(`chat_${chatId}`).emit('message_deleted', { id: messageId });

    } catch (error) {
      console.error('❌ Error deleting message:', error);
      socket.emit('error', { message: 'Ошибка при удалении' });
    }
  });

  // Явный выход (кнопка "Выйти")
  socket.on('logout', async (userId) => {
    if (userSockets.has(userId)) {
      userSockets.get(userId).delete(socket.id);
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId);
        await pool.query('UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = $1', [userId]);
        io.emit('user_status_changed', { userId, isOnline: false });
      }
    }
  });

  // 3. Статус "печатает..."
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    socket.to(`chat_${chatId}`).emit('user_typing', { userId, isTyping });
  });

  // 4. Комнаты чатов
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`👥 Socket ${socket.id} joined chat_${chatId}`);
  });
  
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
  });

  // ✅ 5. ОТПРАВКА СООБЩЕНИЯ (ЭТОГО НЕ ХВАТАЛО!)
    socket.on('send_message', async (data) => {
  const { chatId, content, sender_id, time, file_url, type, duration } = data;
  
  console.log('📨 Получено сообщение:', { type, duration, content }); // ✅ ЛОГ

  try {
    const result = await pool.query(
      'INSERT INTO messages (chat_id, sender_id, content, file_url, type, duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [chatId, sender_id, content, file_url || null, type || 'text', duration || null]
    );
    
    console.log('💾 Сохранено в БД:', { 
      id: result.rows[0].id, 
      duration: result.rows[0].duration 
    }); // ✅ ЛОГ

    const message = {
      id: result.rows[0].id,
      sender_id: result.rows[0].sender_id,
      content: result.rows[0].content,
      file_url: result.rows[0].file_url,
      type: result.rows[0].type,
      duration: result.rows[0].duration, // ✅ Возвращаем
      time: time || new Date(result.rows[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_mine: false
    };

    io.to(`chat_${chatId}`).emit('receive_message', message);
  } catch (error) {
    console.error('❌ Error sending message:', error);
  }
});
});

// POST /api/upload - Загрузка файла
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  // Возвращаем URL для доступа к файлу
  res.json({ url: `http://localhost:5000/uploads/${req.file.filename}` });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});