const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
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
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const useHttps = process.env.HTTPS === 'true' || (process.env.SSL_CRT_FILE && process.env.SSL_KEY_FILE);
let server;
let protocol = 'http';

if (useHttps) {
  try {
    const certPath = process.env.SSL_CRT_FILE && path.resolve(__dirname, process.env.SSL_CRT_FILE);
    const keyPath = process.env.SSL_KEY_FILE && path.resolve(__dirname, process.env.SSL_KEY_FILE);

    if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const sslOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      };

      server = https.createServer(sslOptions, app);
      protocol = 'https';
      console.log(`🔐 HTTPS enabled with cert=${certPath} key=${keyPath}`);
    } else {
      throw new Error('SSL certificate or key file not found');
    }
  } catch (err) {
    console.error('❌ Failed to enable HTTPS, falling back to HTTP:', err.message);
  }
}

if (!server) {
  server = http.createServer(app);
}

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const multer = require('multer');

// Убедись, что папка uploads существует
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Настройка хранилища
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { 
    fileSize: 300 * 1024 * 1024
  }
});

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

// Передаём io и onlineUsers в маршруты через app
const onlineUsers = new Map();
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// ✅ Функция: получить всех пользователей, которые должны видеть статус userId
async function getUsersWhoShouldSeeStatus(userId) {
  try {
    // Находим ВСЕХ пользователей, у которых есть общие чаты с userId
    const result = await pool.query(`
      SELECT DISTINCT cp2.user_id
      FROM chat_participants cp1
      JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
      WHERE cp1.user_id = $1 AND cp2.user_id != $1
    `, [userId]);
    
    return result.rows.map(row => row.user_id);
  } catch (error) {
    console.error('❌ Error getting users who should see status:', error);
    return [];
  }
}

// ✅ Функция: отправить статус всем, кто должен его видеть
async function broadcastStatusToRelevantUsers(userId, isOnline) {
  try {
    const viewers = await getUsersWhoShouldSeeStatus(userId);
    
    console.log(`📢 Статус пользователя ${userId} (${isOnline ? 'ОНЛАЙН' : 'ОФФЛАЙН'}) видят:`, viewers);
    
    for (const viewerId of viewers) {
      const viewerSocketId = onlineUsers.get(String(viewerId));
      if (viewerSocketId) {
        console.log(`  → Отправка пользователю ${viewerId} (сокет ${viewerSocketId})`);
        io.to(viewerSocketId).emit('user_status_changed', {
          userId: userId,
          isOnline: isOnline
        });
      } else {
        console.log(`  → Пользователь ${viewerId} оффлайн, пропускаю`);
      }
    }
  } catch (error) {
    console.error('❌ Error broadcasting status:', error);
  }
}

// ✅ Функция: отправить текущему сокету статусы всех релевантных онлайн пользователей
async function sendRelevantOnlineStatusesToSocket(userId, socket) {
  try {
    const relevantUserIds = await getUsersWhoShouldSeeStatus(userId);
    for (const relevantId of relevantUserIds) {
      const relevantKey = String(relevantId);
      if (onlineUsers.has(relevantKey)) {
        socket.emit('user_status_changed', {
          userId: relevantKey,
          isOnline: true
        });
      }
    }
  } catch (error) {
    console.error('❌ Error sending relevant online statuses:', error);
  }
}

// Socket.io логика
io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  // Аутентификация пользователя
  socket.on('authenticate', async (userId) => {
    if (userId) {
      socket.userId = String(userId);
      onlineUsers.set(socket.userId, socket.id);
      
      console.log(`🔐 Пользователь ${socket.userId} аутентифицирован`);
      
      // ✅ Отправляем статус всем, кто должен видеть этого пользователя
      await broadcastStatusToRelevantUsers(socket.userId, true);
      // ✅ Отправляем новому подключению статусы уже онлайн собеседников
      await sendRelevantOnlineStatusesToSocket(socket.userId, socket);
    }
  });

  // Дисконнект
  socket.on('disconnect', async () => {
    if (socket.userId) {
      const userId = socket.userId;
      onlineUsers.delete(userId);
      
      console.log(`🔌 Пользователь ${userId} отключился`);
      
      // ✅ Отправляем оффлайн статус всем, кто должен видеть
      await broadcastStatusToRelevantUsers(userId, false);
    }
  });

  // Отправка сообщения
  socket.on('send_message', async (data) => {
    const { chatId, content, sender_id, time, file_url, type, duration } = data;
    
    try {
      const result = await pool.query(
        'INSERT INTO messages (chat_id, sender_id, content, file_url, type, duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
        [chatId, sender_id, content, file_url || null, type || 'text', duration || null]
      );
      
      const message = {
        id: result.rows[0].id,
        sender_id: result.rows[0].sender_id,
        content: result.rows[0].content,
        file_url: result.rows[0].file_url,
        type: result.rows[0].type || 'text',
        duration: result.rows[0].duration,
        time: time || new Date(result.rows[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_mine: false,
        chatId: chatId
      };

      io.to(`chat_${chatId}`).emit('receive_message', message);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  });
    socket.on('call-user', async ({ userToCall, offer, signalData, video }) => {
  console.log('socket event call-user', { from: socket.userId, userToCall, video, signalDataExists: !!signalData, offerExists: !!offer });
  // signalData содержит SDP (описание соединения)
  const targetSocketId = onlineUsers.get(String(userToCall));
  if (targetSocketId) {
    io.to(targetSocketId).emit('call-made', {
      signal: signalData,
      from: socket.userId,
      video: video !== false
    });
  } else {
    console.warn('call-user target not online', { userToCall });
  }
});

// 2. Ответ на звонок
socket.on('make-answer', async ({ to, signalData }) => {
  console.log('socket event make-answer', { from: socket.userId, to, signalDataExists: !!signalData });
  const targetSocketId = onlineUsers.get(String(to));
  if (targetSocketId) {
    io.to(targetSocketId).emit('answer-made', {
      signal: signalData,
      from: socket.userId
    });
  } else {
    console.warn('make-answer target not online', { to });
  }
});

// 3. Отклонение звонка
socket.on('reject-call', async ({ to }) => {
  console.log('socket event reject-call', { from: socket.userId, to });
  const targetSocketId = onlineUsers.get(String(to));
  if (targetSocketId) {
    io.to(targetSocketId).emit('call-rejected');
  }
});

// 4. Завершение звонка
socket.on('end-call', async ({ to }) => {
  console.log('socket event end-call', { from: socket.userId, to });
  const targetSocketId = onlineUsers.get(String(to));
  if (targetSocketId) {
    io.to(targetSocketId).emit('call-ended');
  }
});
  // Обнуление счетчика при открытии чата
  socket.on('chat_read', async ({ chatId, userId }) => {
    try {
      await pool.query(
        'UPDATE chat_participants SET unread_count = 0 WHERE chat_id = $1 AND user_id = $2',
        [chatId, userId]
      );
    } catch (error) {
      console.error('❌ Error marking chat as read:', error);
    }
  });

  // Отметка о прочтении
  socket.on('mark_read', async ({ chatId, userId }) => {
    try {
      await pool.query(
        `UPDATE messages 
         SET is_read = TRUE, read_at = NOW() 
         WHERE chat_id = $1 AND sender_id != $2 AND is_read = FALSE`,
        [chatId, userId]
      );

      socket.to(`chat_${chatId}`).emit('messages_read', { chatId, readerId: userId });
      
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  });

  // Редактирование сообщения
  socket.on('edit_message', async ({ messageId, chatId, newContent, senderId }) => {
    try {
      const msg = await pool.query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
      if (msg.rows[0]?.sender_id !== senderId) {
        return socket.emit('error', { message: 'Недостаточно прав' });
      }

      await pool.query(
        'UPDATE messages SET content = $1, is_edited = TRUE, edited_at = NOW() WHERE id = $2',
        [newContent, messageId]
      );

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

  // Удаление сообщения
  socket.on('delete_message', async ({ messageId, chatId, senderId }) => {
    try {
      const msg = await pool.query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
      if (msg.rows[0]?.sender_id !== senderId) {
        return socket.emit('error', { message: 'Недостаточно прав' });
      }

      await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
      io.to(`chat_${chatId}`).emit('message_deleted', { id: messageId });

    } catch (error) {
      console.error('❌ Error deleting message:', error);
      socket.emit('error', { message: 'Ошибка при удалении' });
    }
  });

  // Выход
  socket.on('logout', async (userId) => {
    const userKey = String(userId);
    if (onlineUsers.has(userKey)) {
      onlineUsers.delete(userKey);
      await broadcastStatusToRelevantUsers(userKey, false);
    }
  });

  // Статус "печатает..."
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    socket.to(`chat_${chatId}`).emit('user_typing', { userId, isTyping });
  });

  // Комнаты чатов
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`👥 Socket ${socket.id} joined chat_${chatId}`);
  });
  
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
  });
});

// POST /api/upload - Загрузка файла
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  res.json({ url: `/uploads/${req.file.filename}` });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${protocol}://${HOST === '0.0.0.0' ? '0.0.0.0' : HOST}:${PORT}`);
  console.log(`📡 Socket.IO ready`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});