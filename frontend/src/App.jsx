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
    activeChat,
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
    <div className="flex h-full h-[100dvh] w-full bg-wa-bg-dark overflow-hidden select-none">
      {/* Mobile-first Responsive Layout: Dual-pane on Desktop, Single-pane on Mobile */}
      <div
        className={`w-full h-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col ${
          activeChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <Sidebar onOpenNewGroup={() => setShowNewGroup(true)} />
      </div>

      <div className={`w-full h-full flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatArea />
      </div>

      {/* Modals & Overlays */}
      {activeTab === 'status' && <StatusViewer onClose={() => setActiveTab('chats')} />}
      {activeTab === 'admin' && <AdminPanel onClose={() => setActiveTab('chats')} />}
      {activeTab === 'settings' && <SettingsModal onClose={() => setActiveTab('chats')} />}
      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
      <CallModal />
    </div>
  );
}
