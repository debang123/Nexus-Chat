import React, { useState } from 'react';
import { MessageSquare, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthModal() {
  const { login, register, loading, error } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      await register(name, email, password);
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-wa-bg-dark flex items-center justify-center p-4 chat-pattern-dark select-none">
      <div className="bg-wa-panel-dark max-w-md w-full rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-8 flex flex-col items-center">
        {/* Brand Logo */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/10">
          <MessageSquare className="w-8 h-8 text-emerald-400" />
        </div>

        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Nexus Chat</h1>
        <p className="text-xs text-slate-400 mt-1 mb-6 text-center">
          Production-grade real-time messaging with MERN Stack & Socket.IO
        </p>

        {error && (
          <div className="w-full p-3 mb-4 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex w-full bg-wa-header-dark rounded-xl p-1 mb-6 border border-slate-800">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              !isRegister ? 'bg-emerald-600 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              isRegister ? 'bg-emerald-600 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Alice Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-wa-input-dark pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="user@whatsapp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-wa-input-dark pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-wa-input-dark pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 border border-slate-700/60 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/30 mt-2"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
