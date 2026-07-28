import React, { useState } from 'react';
import { Settings, User, Lock, Shield, Camera, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import API from '../services/api';

export default function SettingsModal({ onClose }) {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put('/users/profile', { name, about });
      updateUser(data.data);
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error updating profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await API.post('/users/avatar', formData);
      updateUser({ avatar: data.data.avatar });
      setMsg('Avatar updated!');
    } catch (err) {
      setMsg('Error uploading avatar');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMsg('Password updated successfully!');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Password update failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md select-none">
      <div className="bg-wa-panel-dark max-w-xl w-full rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-16 px-6 bg-wa-header-dark flex items-center justify-between border-b border-wa-border-dark">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Settings & Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-wa-hover-dark text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {msg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-semibold text-center">
              {msg}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500 shadow-xl"
              />
              <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-slate-400 mt-2">Click avatar to upload photo</p>
          </div>

          {/* Profile Details Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-wa-input-dark p-3 rounded-lg text-sm text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">About</label>
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full bg-wa-input-dark p-3 rounded-lg text-sm text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition"
            >
              Save Profile Changes
            </button>
          </form>

          <hr className="border-slate-800" />

          {/* Password Change Form */}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Security & Password</h3>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-wa-input-dark p-3 rounded-lg text-sm text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-wa-input-dark p-3 rounded-lg text-sm text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
