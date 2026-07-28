const User = require('../models/User');
const Message = require('../models/Message');
const { verifyAccessToken } = require('../utils/generateToken');

// Map of userId -> Set of active socketIds (multi-device / multi-tab support)
const onlineUsersMap = new Map();

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
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      if (!socket.user || !socket.user._id) return;

      const userId = socket.user._id.toString();

      // Multi-device socket tracking
      if (!onlineUsersMap.has(userId)) {
        onlineUsersMap.set(userId, new Set());
      }
      onlineUsersMap.get(userId).add(socket.id);

      console.log(`[Socket] Connected: ${socket.user.name} (${userId}) - Socket: ${socket.id}`);

      // Update user online status in database
      await User.findByIdAndUpdate(userId, { isOnline: true });

      // Broadcast updated online users list to ALL connected clients
      io.emit('presence:online_users', Array.from(onlineUsersMap.keys()));

      // Join personal user room for multi-device broadcast
      socket.join(userId);

      // Setup room
      socket.on('setup', (userData) => {
        try {
          if (userData?._id) {
            socket.join(userData._id);
            socket.emit('connected');
          }
        } catch (e) {
          console.error('[Socket] Setup error:', e.message);
        }
      });

      // Join chat room
      socket.on('join:chat', (chatId) => {
        try {
          if (chatId) {
            socket.join(chatId);
          }
        } catch (e) {
          console.error('[Socket] Join chat error:', e.message);
        }
      });

      // Leave chat room
      socket.on('leave:chat', (chatId) => {
        try {
          if (chatId) socket.leave(chatId);
        } catch (e) {}
      });

      // Typing indicators
      socket.on('typing:start', (data) => {
        try {
          if (data?.chatId && socket.user) {
            socket.in(data.chatId).emit('typing:start', {
              chatId: data.chatId,
              userId: socket.user._id,
              name: socket.user.name,
            });
          }
        } catch (e) {
          console.error('[Socket] Typing start error:', e.message);
        }
      });

      socket.on('typing:stop', (data) => {
        try {
          if (data?.chatId && socket.user) {
            socket.in(data.chatId).emit('typing:stop', {
              chatId: data.chatId,
              userId: socket.user._id,
            });
          }
        } catch (e) {}
      });

      // New Message event
      socket.on('message:send', (newMessageReceived) => {
        try {
          if (!newMessageReceived) return;

          const chat = newMessageReceived.chat;
          const chatId = typeof chat === 'object' ? chat?._id?.toString() : chat?.toString();

          // Broadcast to active chat room
          if (chatId) {
            socket.in(chatId).emit('message:received', newMessageReceived);
          }

          // Also emit to recipient personal user rooms (for real-time sidebar updates)
          if (chat && Array.isArray(chat.users)) {
            chat.users.forEach((u) => {
              const recipientId = (u._id || u).toString();
              if (socket.user && recipientId === socket.user._id.toString()) return;
              io.to(recipientId).emit('message:received', newMessageReceived);
            });
          }
        } catch (e) {
          console.error('[Socket] Message send error:', e.message);
        }
      });

      // Message Read Receipts
      socket.on('message:read', async (data) => {
        try {
          if (!data || !data.messageId || !socket.user) return;

          await Message.findByIdAndUpdate(data.messageId, {
            $addToSet: { readBy: socket.user._id },
          });

          if (data.chatId) {
            io.in(data.chatId).emit('message:read_update', {
              messageId: data.messageId,
              chatId: data.chatId,
              readByUserId: socket.user._id,
            });
          }
        } catch (err) {
          console.error('[Socket] Error updating read receipt:', err.message);
        }
      });

      // WebRTC Calling Signaling
      socket.on('call:initiate', (data) => {
        try {
          if (!data || !data.toUserId) return;
          const userSockets = onlineUsersMap.get(data.toUserId);

          if (userSockets && userSockets.size > 0) {
            io.to(data.toUserId).emit('call:incoming', {
              fromUserId: userId,
              chatId: data.chatId,
              offer: data.offer,
              callType: data.callType || 'video',
              callerInfo: data.callerInfo || {
                _id: userId,
                name: socket.user.name,
                avatar: socket.user.avatar,
              },
            });
          } else {
            socket.emit('call:user_offline', { toUserId: data.toUserId });
          }
        } catch (e) {
          console.error('[Socket] Call initiate error:', e.message);
        }
      });

      socket.on('call:accept', (data) => {
        try {
          if (data?.toUserId) {
            io.to(data.toUserId).emit('call:accepted', {
              answer: data.answer,
              fromUserId: userId,
            });
          }
        } catch (e) {}
      });

      socket.on('call:reject', (data) => {
        try {
          if (data?.toUserId) {
            io.to(data.toUserId).emit('call:rejected', { fromUserId: userId });
          }
        } catch (e) {}
      });

      socket.on('call:end', (data) => {
        try {
          if (data?.toUserId) {
            io.to(data.toUserId).emit('call:ended', { fromUserId: userId });
          }
        } catch (e) {}
      });

      socket.on('call:ice_candidate', (data) => {
        try {
          if (data?.toUserId) {
            io.to(data.toUserId).emit('call:ice_candidate', {
              candidate: data.candidate,
              fromUserId: userId,
            });
          }
        } catch (e) {}
      });

      // Disconnect event
      socket.on('disconnect', async () => {
        try {
          console.log(`[Socket] Disconnected: ${socket.user.name} (${userId})`);

          const userSockets = onlineUsersMap.get(userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              onlineUsersMap.delete(userId);
              const lastSeen = new Date();
              await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
              io.emit('presence:online_users', Array.from(onlineUsersMap.keys()));
            }
          }
        } catch (e) {
          console.error('[Socket] Disconnect error:', e.message);
        }
      });
    } catch (err) {
      console.error('[Socket] Connection handler error:', err.message);
    }
  });
};

module.exports = { registerSocketHandlers };
