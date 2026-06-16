const redis = require('redis');
require('dotenv').config();

const redisUrl =
  process.env.REDIS_URL ||
  process.env.REDIS_PRIVATE_URL ||
  (process.env.REDIS_HOST && process.env.REDIS_PORT
    ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    : null);

if (!redisUrl) {
  console.error('❌ No Redis URL configured. Set REDIS_URL environment variable.');
  process.exit(1);
}

const redisClient = redis.createClient({ url: redisUrl });

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;