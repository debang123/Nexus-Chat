import { create } from 'zustand';
import API from '../services/api';
import { getSocket } from '../services/socket';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {}, // { [chatId]: { userId, name } }
  activeTab: 'chats', // 'chats' | 'status' | 'admin' | 'settings'
  searchQuery: '',
  loadingChats: false,
  loadingMessages: false,

  // WebRTC Call state
  callState: {
    active: false,
    incoming: false,
    callType: 'video', // 'audio' | 'video'
    peerUser: null,
    chatId: null,
    offer: null,
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchChats: async () => {
    set({ loadingChats: true });
    try {
      const { data } = await API.get('/chats');
      set({ chats: data.data || [], loadingChats: false });
    } catch (err) {
      console.error('[ChatStore] Error fetching chats:', err);
      set({ loadingChats: false });
    }
  },

  selectChat: async (chat) => {
    set({ activeChat: chat, loadingMessages: true });
    const socket = getSocket();
    if (socket && chat) {
      socket.emit('join:chat', chat._id);
    }
    try {
      const { data } = await API.get(`/messages/${chat._id}`);
      set({ messages: data.data || [], loadingMessages: false });
    } catch (err) {
      console.error('[ChatStore] Error fetching messages:', err);
      set({ messages: [], loadingMessages: false });
    }
  },

  addMessage: (newMsg) => {
    const { activeChat, messages, chats } = get();
    // If message is for currently active chat
    if (activeChat && activeChat._id === newMsg.chat._id) {
      set({ messages: [...messages, newMsg] });
    }

    // Update latest message in chat list
    const updatedChats = chats.map((c) => {
      if (c._id === newMsg.chat._id) {
        return { ...c, latestMessage: newMsg, updatedAt: new Date().toISOString() };
      }
      return c;
    });
    set({ chats: updatedChats });
  },

  sendMessage: async (chatId, content, file = null, replyTo = null) => {
    try {
      const formData = new FormData();
      formData.append('chatId', chatId);
      if (content) formData.append('content', content);
      if (replyTo) formData.append('replyTo', replyTo);
      if (file) formData.append('file', file);

      const { data } = await API.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newMsg = data.data;
      get().addMessage(newMsg);

      // Emit socket event
      const socket = getSocket();
      if (socket) {
        socket.emit('message:send', newMsg);
      }
      return true;
    } catch (err) {
      console.error('[ChatStore] Error sending message:', err);
      return false;
    }
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  setTyping: (chatId, user, isTyping) => {
    const { typingUsers } = get();
    const updated = { ...typingUsers };
    if (isTyping) {
      updated[chatId] = user;
    } else {
      delete updated[chatId];
    }
    set({ typingUsers: updated });
  },

  startCall: (peerUser, chatId, callType = 'video') => {
    set({
      callState: {
        active: true,
        incoming: false,
        callType,
        peerUser,
        chatId,
        offer: null,
      },
    });

    const socket = getSocket();
    if (socket) {
      socket.emit('call:initiate', {
        toUserId: peerUser._id,
        chatId,
        callType,
      });
    }
  },

  incomingCall: ({ fromUserId, chatId, offer, callType, callerInfo }) => {
    set({
      callState: {
        active: true,
        incoming: true,
        callType,
        peerUser: callerInfo || { _id: fromUserId, name: 'User' },
        chatId,
        offer,
      },
    });
  },

  endCall: () => {
    const { callState } = get();
    if (callState.peerUser) {
      const socket = getSocket();
      if (socket) {
        socket.emit('call:end', { toUserId: callState.peerUser._id });
      }
    }
    set({
      callState: {
        active: false,
        incoming: false,
        callType: 'video',
        peerUser: null,
        chatId: null,
        offer: null,
      },
    });
  },
}));
