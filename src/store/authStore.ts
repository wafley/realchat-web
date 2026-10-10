import { create } from 'zustand';
import type { User, LoginPayload, RegisterPayload, UpdateProfilePayload } from '@/types';
import * as authService from '@/services/auth';
import { queryClient } from '@/lib/queryClient';
import {
  registerPushDevice,
  unregisterPushDevice,
  setExternalUserId,
  removeExternalUserId,
} from '@/services/onesignal';
import { Capacitor } from '@capacitor/core';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const MOCK_USER: User = {
  id: 'dev-user-1',
  email: 'mafzq6750@gmail.com',
  username: 'Dev-Account',
  fullName: 'Alxyzz',
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
  refreshUser: () => Promise<void>;
}

function devLogin(set: (partial: Partial<AuthState>) => void) {
  const token = 'dev-token';
  const refreshToken = 'dev-refresh-token';
  localStorage.setItem('accessToken', token);
  localStorage.setItem('refreshToken', refreshToken);
  set({ user: MOCK_USER, token, isAuthenticated: true, isLoading: false });
}

window.addEventListener('auth:force-logout', () => {
  const state = useAuthStore.getState();
  if (state.isAuthenticated) {
    queryClient.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    if (Capacitor.isNativePlatform()) {
      import('@/services/onesignal.native').then(({ removeNativeExternalUserId, unregisterNativePushDevice }) => {
        void removeNativeExternalUserId();
        void unregisterNativePushDevice();
      });
    } else {
      void removeExternalUserId();
      void unregisterPushDevice();
    }
  }
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('accessToken'),
  isLoading: true,
  isAuthenticated: false,
  login: async (payload) => {
    if (DEV_MODE) { devLogin(set); return; }
    const res = await authService.login(payload);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    set({ user: res.user, token: res.accessToken, isAuthenticated: true, isLoading: false });
    if (Capacitor.isNativePlatform()) {
      const { setNativeExternalUserId, registerNativePushDevice } = await import('@/services/onesignal.native');
      void setNativeExternalUserId(res.user.id);
      // delay biar permission + subscription id kebentuk dulu
      window.setTimeout(() => void registerNativePushDevice(), 1500);
    } else {
      void setExternalUserId(res.user.id);
      void registerPushDevice();
    }
  },
  register: async (payload) => {
    if (DEV_MODE) { devLogin(set); return; }
    await authService.register(payload);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  logout: async () => {
    try {
      if (!DEV_MODE) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) await authService.logout(refreshToken);
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
      set({ user: null, token: null, isAuthenticated: false });
      if (Capacitor.isNativePlatform()) {
        const { removeNativeExternalUserId, unregisterNativePushDevice } = await import('@/services/onesignal.native');
        void removeNativeExternalUserId();
        void unregisterNativePushDevice();
      } else {
        void removeExternalUserId();
        void unregisterPushDevice();
      }
    }
  },
  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
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
      if (Capacitor.isNativePlatform()) {
        const { setNativeExternalUserId, registerNativePushDevice } = await import('@/services/onesignal.native');
        void setNativeExternalUserId(user.id);
        window.setTimeout(() => void registerNativePushDevice(), 1500);
      } else {
        void setExternalUserId(user.id);
        void registerPushDevice();
      }
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      } else {
        // Server down / Network error / 5xx: keep token only if we already have a user (offline), otherwise stay unauthenticated
        const prevUser = useAuthStore.getState().user;
        if (prevUser) {
          set({ token, isAuthenticated: true, isLoading: false });
        } else {
          set({ token, isAuthenticated: false, isLoading: false });
        }
      }
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
    // BE PUT /users/me kadang tidak return hasPassword/provider — merge agar Set Password (google && !hasPassword) tidak hilang setelah pindah page
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            ...updated,
            hasPassword: updated.hasPassword ?? state.user.hasPassword,
            provider: updated.provider ?? state.user.provider,
            avatarUrl: updated.avatarUrl ?? state.user.avatarUrl,
            bannerUrl: updated.bannerUrl ?? state.user.bannerUrl,
          }
        : updated,
    }));
  },
  refreshUser: async () => {
    if (DEV_MODE) return;
    const user = await authService.getMe();
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            ...user,
            hasPassword: user.hasPassword ?? state.user.hasPassword,
            provider: user.provider ?? state.user.provider,
          }
        : user,
    }));
  },
}));
