import { create } from 'zustand';
import type { User, LoginPayload, RegisterPayload, UpdateProfilePayload } from '@/types';
import * as authService from '@/services/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isLoading: true,
  isAuthenticated: false,

  login: async (payload) => {
    const res = await authService.login(payload);
    storeTokens(res.accessToken, res.refreshToken);
    set({ user: res.user, accessToken: res.accessToken, isAuthenticated: true, isLoading: false });
  },

  register: async (payload) => {
    const res = await authService.register(payload);
    storeTokens(res.accessToken, res.refreshToken);
    set({ user: res.user, accessToken: res.accessToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      clearTokens();
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getMe();
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (payload) => {
    const updated = await authService.updateProfile(payload);
    set({ user: updated });
  },
}));
