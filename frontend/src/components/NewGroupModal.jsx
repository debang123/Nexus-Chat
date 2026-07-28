import React, { useState, useEffect } from 'react';
import { Users, X, Check, Search } from 'lucide-react';
import API from '../services/api';
import { useChatStore } from '../store/useChatStore';

export default function NewGroupModal({ onClose }) {
  const { fetchChats, selectChat } = useChatStore();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get(`/users?search=${encodeURIComponent(search)}`);
      setUsers(data.data || []);
    } catch (err) {
      console.error('Error searching users for group:', err);
    }
  };

  const toggleUserSelection = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName || selectedUserIds.length < 1) return;

    setLoading(true);
    try {
      const { data } = await API.post('/chats/group', {
        name: groupName,
        description,
        users: selectedUserIds,
      });

      await fetchChats();
      selectChat(data.data);
      onClose();
    } catch (err) {
      console.error('Error creating group chat:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md select-none">
      <div className="bg-wa-panel-dark max-w-md w-full rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-16 px-6 bg-wa-header-dark flex items-center justify-between border-b border-wa-border-dark">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Create New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-wa-hover-dark text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Product Design Sync"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-wa-input-dark p-3 rounded-lg text-sm text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Group Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Official channel for release updates"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-wa-input-dark p-3 rounded-lg text-sm text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Add Group Members ({selectedUserIds.length} selected)</label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-wa-input-dark pl-9 pr-3 py-2 rounded-lg text-xs text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-800">
              {users.map((u) => {
                const isSelected = selectedUserIds.includes(u._id);
                return (
                  <div
                    key={u._id}
                    onClick={() => toggleUserSelection(u._id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      isSelected ? 'bg-emerald-500/10 border border-emerald-500/40' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-100">{u.name}</h4>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!groupName || selectedUserIds.length < 1 || loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition mt-4"
          >
            {loading ? 'Creating Group...' : 'Create Group Chat'}
          </button>
        </form>
      </div>
    </div>
  );
}
