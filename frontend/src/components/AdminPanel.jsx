import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, MessageSquare, Activity, Ban, CheckCircle, X } from 'lucide-react';
import API from '../services/api';

export default function AdminPanel({ onClose }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/reports'),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setReports(reportsRes.data.data);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      await API.post(`/admin/ban/${userId}`);
      fetchAdminData();
    } catch (err) {
      console.error('Error toggling ban:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-wa-bg-dark/95 flex flex-col backdrop-blur-lg select-none">
      {/* Header */}
      <div className="h-16 px-6 bg-wa-header-dark flex items-center justify-between border-b border-wa-border-dark">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
          <h2 className="text-lg font-bold text-slate-100">Admin Control Center</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-wa-hover-dark text-slate-400 hover:text-slate-100 transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-wa-panel-dark p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Total Users</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{stats?.totalUsers || 0}</h3>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>

          <div className="bg-wa-panel-dark p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Active Online</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats?.activeUsers || 0}</h3>
            </div>
            <Activity className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="bg-wa-panel-dark p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Total Messages</p>
              <h3 className="text-2xl font-black text-purple-400 mt-1">{stats?.totalMessages || 0}</h3>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>

          <div className="bg-wa-panel-dark p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Pending Reports</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{stats?.pendingReports || 0}</h3>
            </div>
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Users Management Table */}
        <div className="bg-wa-panel-dark rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">User Accounts Management</h3>
            <span className="text-xs text-slate-400">{users.length} Registered Users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-wa-header-dark text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-wa-hover-dark/50 transition">
                    <td className="p-3.5 flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      <span className="font-semibold text-slate-100">{u.name}</span>
                    </td>
                    <td className="p-3.5 text-slate-400">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {u.isBanned ? (
                        <span className="text-red-400 font-medium">Banned</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Active</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleBan(u._id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            u.isBanned
                              ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                              : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                          }`}
                        >
                          {u.isBanned ? 'Unban User' : 'Ban User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
