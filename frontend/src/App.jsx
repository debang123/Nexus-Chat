import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import StatusViewer from './components/StatusViewer';
import AdminPanel from './components/AdminPanel';
import SettingsModal from './components/SettingsModal';
import NewGroupModal from './components/NewGroupModal';
import CallModal from './components/CallModal';
import AuthModal from './components/AuthModal';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { initSocket, getSocket } from './services/socket';

export default function App() {
  const { token, isAuthenticated } = useAuthStore();
  const {
    activeTab,
    setActiveTab,
    addMessage,
    setOnlineUsers,
    setTyping,
    incomingCall,
  } = useChatStore();

  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = initSocket(token);

      socket.on('presence:online_users', (users) => {
        setOnlineUsers(users);
      });

      socket.on('presence:update', ({ userId, isOnline }) => {
        setOnlineUsers((prev) => {
          if (isOnline) {
            return prev.includes(userId) ? prev : [...prev, userId];
          } else {
            return prev.filter((id) => id !== userId);
          }
        });
      });

      socket.on('message:received', (newMsg) => {
        addMessage(newMsg);
      });

      socket.on('typing:start', ({ chatId, userId, name }) => {
        setTyping(chatId, { userId, name }, true);
      });

      socket.on('typing:stop', ({ chatId }) => {
        setTyping(chatId, null, false);
      });

      socket.on('call:incoming', (callData) => {
        incomingCall(callData);
      });

      return () => {
        socket.off('presence:online_users');
        socket.off('presence:update');
        socket.off('message:received');
        socket.off('typing:start');
        socket.off('typing:stop');
        socket.off('call:incoming');
      };
    }
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="flex h-screen w-screen bg-wa-bg-dark overflow-hidden select-none">
      {/* Main 2-Pane Web Interface */}
      <Sidebar onOpenNewGroup={() => setShowNewGroup(true)} />
      <ChatArea />

      {/* Modals & Overlays */}
      {activeTab === 'status' && <StatusViewer onClose={() => setActiveTab('chats')} />}
      {activeTab === 'admin' && <AdminPanel onClose={() => setActiveTab('chats')} />}
      {activeTab === 'settings' && <SettingsModal onClose={() => setActiveTab('chats')} />}
      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
      <CallModal />
    </div>
  );
}
