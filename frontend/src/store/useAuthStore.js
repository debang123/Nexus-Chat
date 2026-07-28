import { create } from 'zustand';
import API from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const getInitialState = () => {
  try {
    const saved = localStorage.getItem('whatsapp_auth_user');
    const savedToken = localStorage.getItem('whatsapp_auth_token');
    if (saved && savedToken) {
      return { user: JSON.parse(saved), token: savedToken, isAuthenticated: true };
    }
  } catch (e) {}
  return { user: null, token: null, isAuthenticated: false };
};

export const useAuthStore = create((set, get) => ({
  ...getInitialState(),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/auth/login', { email, password });
      const user = data.data;
      const token = data.data.accessToken;

      localStorage.setItem('whatsapp_auth_user', JSON.stringify(user));
      localStorage.setItem('whatsapp_auth_token', token);

      initSocket(token);
      set({ user, token, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/auth/register', { name, email, password });
      const user = data.data;
      const token = data.data.accessToken;

      localStorage.setItem('whatsapp_auth_user', JSON.stringify(user));
      localStorage.setItem('whatsapp_auth_token', token);

      initSocket(token);
      set({ user, token, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, loading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('whatsapp_auth_user');
    localStorage.removeItem('whatsapp_auth_token');
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updatedUser) => {
    const newUser = { ...get().user, ...updatedUser };
    localStorage.setItem('whatsapp_auth_user', JSON.stringify(newUser));
    set({ user: newUser });
  },
}));
