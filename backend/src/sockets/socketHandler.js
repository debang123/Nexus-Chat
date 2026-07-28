const User = require('../models/User');
const Message = require('../models/Message');
const { verifyAccessToken } = require('../utils/generateToken');

const onlineUsersMap = new Map(); // userId -> socketId

const registerSocketHandlers = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsersMap.set(userId, socket.id);
    console.log(`[Socket] User connected: ${socket.user.name} (${userId}) - Socket: ${socket.id}`);

    // Update user online status
    await User.findByIdAndUpdate(userId, { isOnline: true });
    socket.broadcast.emit('presence:update', { userId, isOnline: true });

    // Send current online user list to connected client
    socket.emit('presence:online_users', Array.from(onlineUsersMap.keys()));

    // Join personal user room for direct notifications
    socket.join(userId);

    // Setup room
    socket.on('setup', (userData) => {
      socket.join(userData._id);
      socket.emit('connected');
    });

    // Join chat room
    socket.on('join:chat', (chatId) => {
      socket.join(chatId);
      console.log(`[Socket] User ${socket.user.name} joined chat room: ${chatId}`);
    });

    // Leave chat room
    socket.on('leave:chat', (chatId) => {
      socket.leave(chatId);
    });

    // Typing indicators
    socket.on('typing:start', ({ chatId }) => {
      socket.in(chatId).emit('typing:start', { chatId, userId: socket.user._id, name: socket.user.name });
    });

    socket.on('typing:stop', ({ chatId }) => {
      socket.in(chatId).emit('typing:stop', { chatId, userId: socket.user._id });
    });

    // New Message event
    socket.on('message:send', (newMessageReceived) => {
      const chat = newMessageReceived.chat;
      if (!chat || !chat.users) return;

      chat.users.forEach((user) => {
        const recipientId = user._id || user;
        if (recipientId.toString() === socket.user._id.toString()) return;

        // Emit to recipient's personal room or chat room
        socket.in(recipientId.toString()).emit('message:received', newMessageReceived);
      });
    });

    // Message Read Receipts (Blue ticks)
    socket.on('message:read', async ({ messageId, chatId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: socket.user._id },
        });

        io.in(chatId).emit('message:read_update', {
          messageId,
          chatId,
          readByUserId: socket.user._id,
        });
      } catch (err) {
        console.error('[Socket] Error updating read receipt:', err.message);
      }
    });

    // WebRTC Calling Signaling
    socket.on('call:initiate', ({ toUserId, chatId, offer, callType, callerInfo }) => {
      const recipientSocketId = onlineUsersMap.get(toUserId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:incoming', {
          fromUserId: userId,
          chatId,
          offer,
          callType, // 'audio' | 'video'
          callerInfo: callerInfo || { _id: userId, name: socket.user.name, avatar: socket.user.avatar },
        });
      } else {
        socket.emit('call:user_offline', { toUserId });
      }
    });

    socket.on('call:accept', ({ toUserId, answer }) => {
      const callerSocketId = onlineUsersMap.get(toUserId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:accepted', { answer, fromUserId: userId });
      }
    });

    socket.on('call:reject', ({ toUserId }) => {
      const callerSocketId = onlineUsersMap.get(toUserId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:rejected', { fromUserId: userId });
      }
    });

    socket.on('call:end', ({ toUserId }) => {
      const peerSocketId = onlineUsersMap.get(toUserId);
      if (peerSocketId) {
        io.to(peerSocketId).emit('call:ended', { fromUserId: userId });
      }
    });

    socket.on('call:ice_candidate', ({ toUserId, candidate }) => {
      const peerSocketId = onlineUsersMap.get(toUserId);
      if (peerSocketId) {
        io.to(peerSocketId).emit('call:ice_candidate', { candidate, fromUserId: userId });
      }
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${socket.user.name} (${userId})`);
      onlineUsersMap.delete(userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
      socket.broadcast.emit('presence:update', { userId, isOnline: false, lastSeen });
    });
  });
};

module.exports = { registerSocketHandlers };
