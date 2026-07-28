import React, { useState, useEffect } from 'react';
import {
  MessageSquarePlus,
  CircleDashed,
  ShieldAlert,
  Settings,
  LogOut,
  Search,
  Users,
  CheckCheck,
  Check,
  Plus,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import API from '../services/api';

export default function Sidebar({ onOpenNewGroup }) {
  const { user, logout } = useAuthStore();
  const {
    chats,
    activeChat,
    selectChat,
    activeTab,
    setActiveTab,
    fetchChats,
    onlineUsers,
    typingUsers,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'groups'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  // Search users when searchQuery is typed
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const { data } = await API.get(`/users?search=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data.data || []);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartDirectChat = async (targetUser) => {
    try {
      const { data } = await API.post('/chats', { userId: targetUser._id });
      await fetchChats();
      selectChat(data.data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error starting direct chat:', err);
    }
  };

  const getChatPartner = (chat) => {
    if (chat.isGroupChat) return null;
    return chat.users.find((u) => u._id !== user?._id);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const filteredChats = chats.filter((chat) => {
    const partner = getChatPartner(chat);
    const chatName = chat.isGroupChat ? chat.name : partner?.name || 'Direct Chat';
    const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'groups') return chat.isGroupChat && matchesSearch;
    if (filter === 'unread') return chat.unreadCount > 0 && matchesSearch;
    return matchesSearch;
  });

  return (
    <aside className="w-full md:w-96 flex flex-col bg-wa-panel-dark border-r border-wa-border-dark h-full select-none">
      {/* Top Header */}
      <div className="h-16 bg-wa-header-dark px-4 flex items-center justify-between border-b border-wa-border-dark">
        <div
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition"
        >
          <div className="relative">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border border-emerald-500/50"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-wa-header-dark"></span>
          </div>
          <div>
            <h2 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition">
              {user?.name}
            </h2>
            <p className="text-xs text-slate-400">{user?.role === 'admin' ? '👑 Admin' : 'Online'}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 text-slate-300">
          <button
            title="Stories & Status"
            onClick={() => setActiveTab('status')}
            className={`p-2 rounded-full hover:bg-wa-hover-dark transition ${
              activeTab === 'status' ? 'text-emerald-400 bg-wa-hover-dark' : ''
            }`}
          >
            <CircleDashed className="w-5 h-5" />
          </button>

          <button
            title="New Group Chat"
            onClick={onOpenNewGroup}
            className="p-2 rounded-full hover:bg-wa-hover-dark transition"
          >
            <Users className="w-5 h-5" />
          </button>

          {user?.role === 'admin' && (
            <button
              title="Admin Dashboard"
              onClick={() => setActiveTab('admin')}
              className={`p-2 rounded-full hover:bg-wa-hover-dark transition ${
                activeTab === 'admin' ? 'text-amber-400 bg-wa-hover-dark' : ''
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </button>
          )}

          <button
            title="Settings"
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-full hover:bg-wa-hover-dark transition ${
              activeTab === 'settings' ? 'text-emerald-400 bg-wa-hover-dark' : ''
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            title="Logout"
            onClick={logout}
            className="p-2 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 bg-wa-panel-dark border-b border-wa-border-dark">
        <div className="relative flex items-center bg-wa-input-dark rounded-lg px-3 py-1.5 border border-slate-700/50 focus-within:border-emerald-500/80 transition">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mt-3">
          {['all', 'unread', 'groups'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
                filter === f
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50'
                  : 'bg-wa-header-dark text-slate-400 hover:text-slate-200 hover:bg-wa-hover-dark'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List / Search Results */}
      <div className="flex-1 overflow-y-auto divide-y divide-wa-border-dark/50">
        {/* User Search Results */}
        {searchQuery.trim() && searchResults.length > 0 && (
          <div className="bg-wa-header-dark/50 p-2">
            <h4 className="text-xs uppercase font-semibold text-emerald-400 px-2 py-1 flex items-center justify-between">
              <span>Global User Results</span>
              <span className="text-[10px] text-slate-400">{searchResults.length} found</span>
            </h4>
            {searchResults.map((u) => (
              <div
                key={u._id}
                onClick={() => handleStartDirectChat(u)}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-wa-hover-dark cursor-pointer transition"
              >
                <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-slate-100 truncate">{u.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{u.about || u.email}</p>
                </div>
                <UserPlus className="w-4 h-4 text-emerald-400" />
              </div>
            ))}
          </div>
        )}

        {/* Existing Chat List */}
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">No chats found.</p>
            <p className="text-xs mt-1 text-slate-500">Search for a user above to start chatting!</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const partner = getChatPartner(chat);
            const chatName = chat.isGroupChat ? chat.name : partner?.name || 'Direct Chat';
            const chatAvatar = chat.isGroupChat ? chat.avatar : partner?.avatar;
            const online = !chat.isGroupChat && partner ? isUserOnline(partner._id) : false;
            const isTyping = typingUsers[chat._id];
            const isSelected = activeChat?._id === chat._id;

            return (
              <div
                key={chat._id}
                onClick={() => {
                  setActiveTab('chats');
                  selectChat(chat);
                }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                  isSelected
                    ? 'bg-wa-hover-dark border-l-4 border-emerald-500'
                    : 'hover:bg-wa-hover-dark/60'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chatAvatar}
                    alt={chatName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-700"
                  />
                  {online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-wa-panel-dark rounded-full"></span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-100 truncate">{chatName}</h3>
                    <span className="text-[11px] text-slate-400">
                      {chat.updatedAt
                        ? new Date(chat.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    {isTyping ? (
                      <p className="text-xs text-emerald-400 font-medium animate-pulse">
                        typing...
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                        {chat.latestMessage && (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline-block flex-shrink-0" />
                        )}
                        <span>
                          {chat.latestMessage?.content ||
                            (chat.latestMessage?.media?.type !== 'none'
                              ? `📷 ${chat.latestMessage?.media?.type}`
                              : 'No messages yet')}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
