import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Mic,
  CheckCheck,
  Check,
  FileText,
  Download,
  Reply,
  Trash2,
  Edit2,
  X,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { getSocket } from '../services/socket';
import API from '../services/api';

export default function ChatArea() {
  const { user } = useAuthStore();
  const {
    activeChat,
    messages,
    sendMessage,
    onlineUsers,
    typingUsers,
    startCall,
    addMessage,
  } = useChatStore();

  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getPartner = () => {
    if (!activeChat || activeChat.isGroupChat) return null;
    return activeChat.users.find((u) => u._id !== user?._id);
  };

  const partner = getPartner();
  const chatName = activeChat?.isGroupChat ? activeChat.name : partner?.name || 'Direct Chat';
  const chatAvatar = activeChat?.isGroupChat ? activeChat.avatar : partner?.avatar;
  const isOnline = partner ? onlineUsers.includes(partner._id) : false;
  const isTyping = typingUsers[activeChat?._id];

  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    const socket = getSocket();
    if (socket && activeChat) {
      socket.emit('typing:start', { chatId: activeChat._id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { chatId: activeChat._id });
      }, 2000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(file.name);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() && !selectedFile) return;

    if (editingMessage) {
      try {
        await API.put(`/messages/${editingMessage._id}`, { content: inputContent });
        setEditingMessage(null);
      } catch (err) {
        console.error('Error editing message:', err);
      }
    } else {
      await sendMessage(activeChat._id, inputContent, selectedFile, replyingTo?._id);
    }

    setInputContent('');
    setSelectedFile(null);
    setFilePreview(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleReact = async (messageId, emoji) => {
    try {
      const { data } = await API.post(`/messages/${messageId}/react`, { emoji });
      setActiveReactionMessageId(null);
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  };

  const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      await API.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-wa-bg-dark text-slate-400 p-8 select-none">
        <div className="w-24 h-24 rounded-full bg-wa-header-dark flex items-center justify-center mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <Send className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">Nexus Chat</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md text-center">
          Send and receive messages with ultra-low latency. Choose a chat from the sidebar to start real-time messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-wa-bg-dark chat-pattern-dark relative select-none">
      {/* Active Chat Header */}
      <div className="h-16 bg-wa-header-dark px-4 flex items-center justify-between border-b border-wa-border-dark z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={chatAvatar} alt={chatName} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-wa-header-dark"></span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100">{chatName}</h3>
            <p className="text-xs text-slate-400">
              {isTyping
                ? `${isTyping.name} is typing...`
                : activeChat.isGroupChat
                ? `${activeChat.users?.length || 0} members`
                : isOnline
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-slate-300">
          {partner && (
            <>
              <button
                title="Voice Call"
                onClick={() => startCall(partner, activeChat._id, 'audio')}
                className="p-2.5 rounded-full hover:bg-wa-hover-dark text-slate-300 hover:text-emerald-400 transition"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                title="Video Call"
                onClick={() => startCall(partner, activeChat._id, 'video')}
                className="p-2.5 rounded-full hover:bg-wa-hover-dark text-slate-300 hover:text-emerald-400 transition"
              >
                <Video className="w-5 h-5" />
              </button>
            </>
          )}
          <button title="Search" className="p-2.5 rounded-full hover:bg-wa-hover-dark transition">
            <Search className="w-5 h-5" />
          </button>
          <button title="Menu" className="p-2.5 rounded-full hover:bg-wa-hover-dark transition">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isSentByMe = msg.sender._id === user?._id || msg.sender === user?._id;
          const reactions = msg.reactions || [];

          return (
            <div
              key={msg._id}
              className={`flex flex-col group relative ${isSentByMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-md md:max-w-lg rounded-2xl px-4 py-2 text-sm shadow-md relative ${
                  isSentByMe
                    ? 'bg-wa-bubble-sent-dark text-slate-100 rounded-tr-none border border-emerald-600/30'
                    : 'bg-wa-bubble-recv-dark text-slate-100 rounded-tl-none border border-slate-700/50'
                }`}
              >
                {/* Group Chat Sender Name */}
                {activeChat.isGroupChat && !isSentByMe && (
                  <p className="text-xs font-semibold text-emerald-400 mb-1">
                    {msg.sender.name || 'Member'}
                  </p>
                )}

                {/* Reply snippet preview if replying to a message */}
                {msg.replyTo && (
                  <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-4 border-emerald-400 text-xs">
                    <p className="font-semibold text-emerald-400">
                      {msg.replyTo.sender?.name || 'Message'}
                    </p>
                    <p className="text-slate-300 truncate">{msg.replyTo.content || 'Media'}</p>
                  </div>
                )}

                {/* Media Content */}
                {msg.media && msg.media.type !== 'none' && (
                  <div className="mb-2 rounded-lg overflow-hidden border border-slate-700/50">
                    {msg.media.type === 'image' && (
                      <img
                        src={msg.media.url}
                        alt="attachment"
                        className="max-h-64 w-full object-cover"
                      />
                    )}
                    {msg.media.type === 'video' && (
                      <video src={msg.media.url} controls className="max-h-64 w-full rounded-lg" />
                    )}
                    {msg.media.type === 'audio' && (
                      <div className="flex items-center gap-3 p-3 bg-slate-800/80">
                        <Volume2 className="w-6 h-6 text-emerald-400" />
                        <audio src={msg.media.url} controls className="w-full h-8" />
                      </div>
                    )}
                    {msg.media.type === 'document' && (
                      <a
                        href={msg.media.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-slate-800 transition"
                      >
                        <FileText className="w-6 h-6 text-emerald-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {msg.media.name || 'Document'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {Math.round(msg.media.size / 1024)} KB
                          </p>
                        </div>
                        <Download className="w-4 h-4 text-slate-400" />
                      </a>
                    )}
                  </div>
                )}

                {/* Text Content */}
                {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}

                {/* Timestamp & Ticks */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                  {msg.isEdited && <span className="italic mr-1">edited</span>}
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isSentByMe && (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline-block" />
                  )}
                </div>

                {/* Reactions Overlay */}
                {reactions.length > 0 && (
                  <div className="absolute -bottom-2 right-2 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1 shadow">
                    {reactions.map((r, idx) => (
                      <span key={idx} className="text-xs">
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}

                {/* Context Action Hover Menu */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex items-center bg-slate-900/90 rounded-lg border border-slate-700/80 p-0.5 shadow-md">
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 hover:text-emerald-400 text-slate-300"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveReactionMessageId(
                        activeReactionMessageId === msg._id ? null : msg._id
                      )
                    }
                    className="p-1 hover:text-amber-400 text-slate-300"
                    title="React"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                  {isSentByMe && (
                    <>
                      <button
                        onClick={() => {
                          setEditingMessage(msg);
                          setInputContent(msg.content);
                        }}
                        className="p-1 hover:text-blue-400 text-slate-300"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg._id, true)}
                        className="p-1 hover:text-red-400 text-slate-300"
                        title="Delete for Everyone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Emoji Reaction Selector */}
                {activeReactionMessageId === msg._id && (
                  <div className="absolute bottom-full mb-1 right-0 bg-slate-800 p-1.5 rounded-full border border-slate-700 flex gap-2 shadow-xl z-20">
                    {['❤️', '🔥', '👍', '😂', '😮', '🙏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(msg._id, emoji)}
                        className="hover:scale-125 transition text-base"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply or Edit Banner */}
      {(replyingTo || editingMessage) && (
        <div className="bg-wa-header-dark px-4 py-2 border-t border-wa-border-dark flex items-center justify-between">
          <div className="border-l-4 border-emerald-400 pl-3">
            <p className="text-xs font-semibold text-emerald-400">
              {editingMessage ? 'Editing Message' : `Replying to ${replyingTo?.sender?.name}`}
            </p>
            <p className="text-xs text-slate-300 truncate max-w-md">
              {editingMessage ? editingMessage.content : replyingTo?.content || 'Media'}
            </p>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              setInputContent('');
            }}
            className="p-1 rounded-full hover:bg-wa-hover-dark text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Preview Banner */}
      {selectedFile && (
        <div className="bg-wa-header-dark px-4 py-2 border-t border-wa-border-dark flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-medium text-slate-200 truncate">{selectedFile.name}</span>
          </div>
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            className="p-1 rounded-full hover:bg-wa-hover-dark text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input Box */}
      <form
        onSubmit={handleSend}
        className="bg-wa-header-dark px-4 py-3 border-t border-wa-border-dark flex items-center gap-3 relative z-10"
      >
        {/* Emoji Picker toggle */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-full hover:bg-wa-hover-dark text-slate-400 hover:text-slate-200 transition"
        >
          <Smile className="w-6 h-6" />
        </button>

        {/* Attachment picker */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-wa-hover-dark text-slate-400 hover:text-slate-200 transition"
        >
          <Paperclip className="w-6 h-6" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Input Text Field */}
        <input
          type="text"
          placeholder="Type a message..."
          value={inputContent}
          onChange={handleInputChange}
          className="flex-1 bg-wa-input-dark text-slate-100 text-sm rounded-lg px-4 py-2.5 border border-slate-700/50 focus:outline-none focus:border-emerald-500/80 transition"
        />

        {/* Send Button / Voice Note Icon */}
        <button
          type="submit"
          disabled={!inputContent.trim() && !selectedFile}
          className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-900 font-bold transition flex items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <Send className="w-5 h-5" />
        </button>

        {/* Floating Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 z-50 shadow-2xl">
            <EmojiPicker
              onEmojiClick={(emojiObject) => setInputContent((prev) => prev + emojiObject.emoji)}
              theme="dark"
            />
          </div>
        )}
      </form>
    </div>
  );
}
