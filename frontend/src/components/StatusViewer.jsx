import React, { useState, useEffect } from 'react';
import { CircleDashed, Plus, X, Eye } from 'lucide-react';
import API from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export default function StatusViewer({ onClose }) {
  const { user } = useAuthStore();
  const [statuses, setStatuses] = useState([]);
  const [activeStatus, setActiveStatus] = useState(null);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const { data } = await API.get('/status');
      setStatuses(data.data || []);
    } catch (err) {
      console.error('Error fetching statuses:', err);
    }
  };

  const handleCreateStatus = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (caption) formData.append('caption', caption);
      if (file) formData.append('media', file);

      await API.post('/status', formData);
      setCaption('');
      setFile(null);
      setShowAddModal(false);
      fetchStatuses();
    } catch (err) {
      console.error('Error creating status:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col backdrop-blur-md select-none">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <CircleDashed className="w-6 h-6 text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-100">Status & Stories</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left List Pane */}
        <div className="w-80 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
          {/* Post New Status Button */}
          <div
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 p-3 rounded-xl bg-wa-header-dark hover:bg-wa-hover-dark cursor-pointer transition border border-emerald-500/20"
          >
            <div className="relative">
              <img src={user?.avatar} alt={user?.name} className="w-12 h-12 rounded-full object-cover" />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 font-bold text-xs">
                +
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">My Status</h4>
              <p className="text-xs text-slate-400">Click to add status update</p>
            </div>
          </div>

          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Recent Updates</h3>

          {statuses.length === 0 ? (
            <p className="text-xs text-slate-500 p-2">No recent status updates available.</p>
          ) : (
            statuses.map((st) => (
              <div
                key={st._id}
                onClick={() => setActiveStatus(st)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                  activeStatus?._id === st._id ? 'bg-wa-hover-dark border-l-4 border-emerald-500' : 'hover:bg-slate-800'
                }`}
              >
                <div className="p-0.5 rounded-full border-2 border-emerald-500">
                  <img src={st.user?.avatar} alt={st.user?.name} className="w-10 h-10 rounded-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-200">{st.user?.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    {new Date(st.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Active Story Viewer Pane */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {activeStatus ? (
            <div className="max-w-md w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col items-center p-4">
              <div className="w-full flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                <img src={activeStatus.user?.avatar} alt={activeStatus.user?.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{activeStatus.user?.name}</h4>
                  <p className="text-xs text-slate-400">
                    {new Date(activeStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {activeStatus.mediaUrl ? (
                <img src={activeStatus.mediaUrl} alt="Status media" className="max-h-96 w-full object-contain rounded-lg mb-4" />
              ) : (
                <div
                  className="w-full h-64 rounded-lg flex items-center justify-center p-6 text-center text-lg font-bold text-white mb-4"
                  style={{ backgroundColor: activeStatus.bgColor || '#00a884' }}
                >
                  {activeStatus.caption}
                </div>
              )}

              {activeStatus.caption && activeStatus.mediaUrl && (
                <p className="text-sm text-slate-200 text-center mb-4">{activeStatus.caption}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>{activeStatus.viewers?.length || 1} views</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a status update from the left sidebar to view</p>
          )}
        </div>
      </div>

      {/* Post New Status Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateStatus}
            className="bg-wa-header-dark p-6 rounded-2xl max-w-sm w-full space-y-4 border border-slate-700 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-100">Add New Status</h3>
            <textarea
              placeholder="What's on your mind?..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-wa-input-dark p-3 rounded-lg text-sm text-slate-100 placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-emerald-500"
              rows={3}
            />
            <div>
              <label className="text-xs text-slate-400 block mb-1">Attach Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="text-xs text-slate-300"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950"
              >
                Post Status
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
