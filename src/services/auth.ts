import axios from 'axios';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export function loginWithGoogle(): void {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
}

export function loginWithFacebook(): void {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/facebook`;
}
