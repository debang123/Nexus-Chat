const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { initRedis } = require('./config/redis');
const { registerSocketHandlers } = require('./sockets/socketHandler');

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  // Connect MongoDB
  await connectDB();

  // Create HTTP Server
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Attempt Redis Pub/Sub Adapter initialization
  const { pubClient, subClient, redisAvailable } = await initRedis();
  if (redisAvailable && pubClient && subClient) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket.IO] Redis adapter enabled for horizontal scaling across instances');
  } else {
    console.log('[Socket.IO] Operating in single-instance memory adapter mode');
  }

  // Register Socket event handlers
  registerSocketHandlers(io);

  // Listen on 0.0.0.0 for cross-interface compatibility
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Nexus Chat Backend Running on Port ${PORT}`);
    console.log(`📡 WebSocket Gateway ready at ws://localhost:${PORT}`);
    console.log(`====================================================`);
  });
};

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
