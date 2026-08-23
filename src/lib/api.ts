import axios from 'axios';
import { socketClient } from '@/lib/socket';
import { getApiUrl } from '@/lib/url';

const api = axios.create({
  baseURL: getApiUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint = originalRequest.url?.startsWith('/auth/');
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new CustomEvent('auth:force-logout'));
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${getApiUrl()}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      const newAccessToken = data.data?.accessToken ?? data.accessToken;
      const newRefreshToken = data.data?.refreshToken ?? data.refreshToken;

      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      socketClient.refreshAuthToken();

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError, null);
      const isAuthError = refreshError.response?.status === 401 || refreshError.response?.status === 403;
      if (isAuthError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('auth:force-logout'));
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
