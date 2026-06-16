const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }
);

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

// ✅ ВАЖНО: Ловим ошибки подключения
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  // Не делаем process.exit, чтобы сервер не падал
});

// ✅ Проверяем подключение сразу при старте
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error acquiring PostgreSQL client:', err.message);
  } else {
    console.log('🗄️ PostgreSQL pool ready');
    release();
  }
});

module.exports = pool;