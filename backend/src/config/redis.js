const { createClient } = require('redis');

let pubClient = null;
let subClient = null;
let redisAvailable = false;

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  try {
    pubClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 500,
        reconnectStrategy: false, // Don't hang on connection failure
      },
    });
    subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      if (!redisAvailable) return;
      console.warn('[Redis] Client error:', err.message);
    });

    await pubClient.connect();
    await subClient.connect();
    redisAvailable = true;
    console.log('[Redis] Connected successfully to Redis Pub/Sub');
    return { pubClient, subClient, redisAvailable: true };
  } catch (error) {
    console.warn('[Redis] Could not connect to Redis server. Operating in single-node memory mode.');
    redisAvailable = false;
    return { pubClient: null, subClient: null, redisAvailable: false };
  }
};

const isRedisReady = () => redisAvailable;

module.exports = { initRedis, isRedisReady, getClients: () => ({ pubClient, subClient }) };
