import { create } from 'zustand';
import type { User, LoginPayload, RegisterPayload } from '@/types';
import * as authService from '@/services/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
  login: async (payload) => {
    const res = await authService.login(payload);
    localStorage.setItem('token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },
  register: async (payload) => {
    const res = await authService.register(payload);
    localStorage.setItem('token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },
  logout: async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getMe();
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
