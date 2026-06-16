# Z-Gram

Веб-мессенджер, вдохновлённый Telegram. Поддерживает текстовые сообщения, медиафайлы, голосовые сообщения и видеозвонки в реальном времени.

## Стек технологий

**Клиент**
- React 19, Redux Toolkit
- Tailwind CSS
- Socket.io-client — real-time соединение
- Simple-Peer (WebRTC) — видео/аудио звонки
- html5-qrcode / qrcode.react — QR-авторизация

**Сервер**
- Node.js + Express 5
- Socket.io — WebSocket-сервер
- PostgreSQL (pg) — основная база данных
- Redis — хранение QR-токенов
- JWT (access + refresh токены)
- Multer — загрузка файлов
- bcryptjs — хеширование паролей

## Функциональность

- Регистрация и вход по номеру телефона
- Вход по QR-коду (как в Telegram Web)
- Личные и групповые чаты
- Отправка текста, изображений, видео, файлов с подписью
- Голосовые сообщения
- Видео- и аудиозвонки (WebRTC, P2P)
- Индикатор «печатает...»
- Статус онлайн / последний раз в сети
- Счётчик непрочитанных сообщений
- Поиск по сообщениям в чате
- Поиск чатов в сайдбаре
- Закреплённые чаты с drag-and-drop сортировкой
- Редактирование и удаление сообщений
- Уведомления: браузерные + in-app тосты + звук
- Отключение уведомлений для конкретного чата
- Профиль с аватаром (обрезка через crop)
- Очистка истории и удаление чата
- Удаление аккаунта
- Адаптивная вёрстка (мобильная / десктоп)

## Структура проекта

```
z-gram/
├── client/                  # React-приложение
│   └── src/
│       ├── components/      # UI-компоненты
│       ├── hooks/           # useSocket, useWebRTC
│       ├── pages/           # AuthPage
│       ├── store/           # Redux-слайсы (auth, chats, messages)
│       └── services/        # axios-инстанс, эндпоинты
├── server/                  # Node.js-сервер
│   ├── config/              # database.js, redis.js
│   ├── controllers/         # authController, usersController
│   ├── db/                  # schema.sql, init.js
│   ├── middleware/          # authMiddleware (JWT)
│   ├── routes/              # auth, chats, users, qr
│   └── index.js             # Express + Socket.io
└── package.json             # корневой — для Railway
```

## Локальный запуск

### Требования

- Node.js 18+
- PostgreSQL
- Redis

### Через Docker (рекомендуется)

```bash
git clone https://github.com/fFoxer/z-gram.git
cd z-gram
docker-compose up --build
```

После запуска:
- Клиент: http://localhost:3000
- Сервер API: http://localhost:5000

### Вручную

**1. Настроить переменные окружения**

Создать файл `server/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=zgram_user
DB_PASSWORD=zgram_password123
DB_NAME=zgram_db

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

HTTPS=false
```

**2. Инициализировать базу данных**

```bash
cd server && npm install && node db/init.js
```

**3. Запустить сервер**

```bash
cd server && npm run dev
```

**4. Запустить клиент**

```bash
cd client && npm install && npm start
```

## API

### Аутентификация

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/qr/generate` | Генерация QR-токена |
| POST | `/api/auth/qr/confirm` | Подтверждение QR-входа |

### Пользователи

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/users/me` | Свой профиль |
| PUT | `/api/users/me` | Обновить профиль |
| DELETE | `/api/users/me` | Удалить аккаунт |
| GET | `/api/users/search?q=` | Поиск по username / телефону |
| GET | `/api/users/:id/profile` | Профиль пользователя |

### Чаты

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/chats` | Список чатов |
| POST | `/api/chats` | Создать личный чат |
| POST | `/api/chats/group` | Создать групповой чат |
| GET | `/api/chats/:id/messages` | Сообщения чата |
| DELETE | `/api/chats/:id/messages` | Очистить историю |
| DELETE | `/api/chats/:id` | Покинуть / удалить чат |
| GET | `/api/chats/:id/participants` | Участники группы |
| POST | `/api/chats/:id/participants` | Добавить участника |

### Файлы

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/api/upload` | Загрузить файл (до 300 МБ) |

## Socket.io события

### Клиент → Сервер

| Событие | Данные | Описание |
|---------|--------|----------|
| `authenticate` | `userId` | Авторизовать соединение |
| `join_chat` | `chatId` | Вступить в комнату чата |
| `send_message` | `{chatId, content, sender_id, type, file_url, duration}` | Отправить сообщение |
| `chat_read` | `{chatId, userId}` | Сбросить счётчик непрочитанных |
| `mark_read` | `{chatId, userId}` | Пометить сообщения прочитанными |
| `typing` | `{chatId, userId, isTyping}` | Статус «печатает» |
| `edit_message` | `{messageId, chatId, newContent, senderId}` | Редактировать сообщение |
| `delete_message` | `{messageId, chatId, senderId}` | Удалить сообщение |
| `join_qr_room` | `qrToken` | Подписаться на QR-событие |
| `call-user` | `{userToCall, signalData, video}` | Инициировать звонок |
| `make-answer` | `{to, signalData}` | Ответить на звонок |
| `reject-call` | `{to}` | Отклонить звонок |
| `end-call` | `{to}` | Завершить звонок |

### Сервер → Клиент

| Событие | Описание |
|---------|----------|
| `receive_message` | Входящее сообщение |
| `user_status_changed` | Смена онлайн-статуса |
| `user_typing` | Пользователь печатает |
| `message_edited` | Сообщение отредактировано |
| `message_deleted` | Сообщение удалено |
| `messages_read` | Сообщения прочитаны |
| `history_cleared` | История чата очищена |
| `user_profile_updated` | Обновлён профиль пользователя |
| `qr_login_success` | QR-вход подтверждён |
| `call-made` | Входящий звонок |
| `answer-made` | Ответ на звонок |
| `call-rejected` | Звонок отклонён |
| `call-ended` | Звонок завершён |

