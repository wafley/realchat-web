import { create } from 'zustand';
import type { User, LoginPayload, RegisterPayload, UpdateProfilePayload } from '@/types';
import * as authService from '@/services/auth';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const MOCK_USER: User = {
  id: 'dev-user-1',
  email: 'dev@hallowok.com',
  username: 'devuser',
  fullName: 'Dev User',
  status: 'online',
  createdAt: new Date('2026-01-01'),
};

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
}

function devLogin(set: (partial: Partial<AuthState>) => void) {
  const token = 'dev-token';
  localStorage.setItem('token', token);
  set({ user: MOCK_USER, token, isAuthenticated: true, isLoading: false });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
  login: async (payload) => {
    if (DEV_MODE) { devLogin(set); return; }
    const res = await authService.login(payload);
    localStorage.setItem('token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },
  register: async (payload) => {
    if (DEV_MODE) { devLogin(set); return; }
    const res = await authService.register(payload);
    localStorage.setItem('token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },
  logout: async () => {
    try {
      if (!DEV_MODE) await authService.logout();
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
    if (DEV_MODE) {
      set({ user: MOCK_USER, token, isAuthenticated: true, isLoading: false });
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
  updateProfile: async (payload: UpdateProfilePayload) => {
    if (DEV_MODE) {
      set((state) => ({
        user: state.user ? { ...state.user, ...payload } : null,
      }));
      return;
    }
    const updated = await authService.updateProfile(payload);
    set({ user: updated });
  },
}));
