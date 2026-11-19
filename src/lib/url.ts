import { Capacitor } from '@capacitor/core';

const WEB_API_URL = import.meta.env.VITE_API_URL ?? '/api';
const WEB_SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000';
const NATIVE_API_URL = import.meta.env.VITE_NATIVE_API_URL ?? '';
const NATIVE_SOCKET_URL = import.meta.env.VITE_NATIVE_SOCKET_URL ?? '';

const DEFAULT_BACKEND_URL = 'https://hallowok-app.app.hostingin.net';

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getApiUrl(): string {
  return isNativeApp() && NATIVE_API_URL ? NATIVE_API_URL : WEB_API_URL;
}

export function getSocketUrl(): string {
  return isNativeApp() && NATIVE_SOCKET_URL ? NATIVE_SOCKET_URL : WEB_SOCKET_URL;
}

/**
 * Mendapatkan base origin backend (mis. https://hallowok-app.app.hostingin.net).
 * Otomatis mendeteksi dari environment variable (native/web) atau fallback ke domain live.
 */
export function getBackendBaseUrl(): string {
  const candidates = [
    import.meta.env.VITE_NATIVE_API_URL,
    import.meta.env.VITE_NATIVE_SOCKET_URL,
    import.meta.env.VITE_SOCKET_URL,
    import.meta.env.VITE_API_URL,
  ];

  for (const candidate of candidates) {
    if (candidate && /^https?:\/\//i.test(candidate)) {
      try {
        return new URL(candidate).origin;
      } catch {}
    }
  }

  return DEFAULT_BACKEND_URL;
}

/**
 * Mengubah path file relatif (seperti `/uploads/xxx.png`) menjadi URL absolut
 * yang menunjuk langsung ke server backend, sehingga foto/media tidak pernah 404
 * baik di Web (Vercel) maupun di Mobile (Capacitor APK).
 */
export function resolveFileUrl(value?: string | null): string | undefined {
  if (!value) return undefined;

  // Blob URL (edit/upload preview) & data URL sudah memiliki origin sendiri
  if (/^(data:|blob:)/i.test(value)) return value;

  const baseOrigin = getBackendBaseUrl();

  // Jika sudah URL absolut HTTP/HTTPS
  if (/^https?:\/\//i.test(value)) {
    try {
      const source = new URL(value);
      // Ganti URL localhost lama atau Railway lama dengan base backend saat ini
      if (
        ['localhost', '127.0.0.1', '0.0.0.0'].includes(source.hostname) ||
        source.hostname.includes('railway.app')
      ) {
        return `${baseOrigin}${source.pathname}${source.search}${source.hash}`;
      }
      return value;
    } catch {
      return value;
    }
  }

  const path = value.startsWith('/') ? value : `/${value}`;

  // Selalu gabungkan dengan base URL backend untuk path relatif (/uploads/xxx)
  return `${baseOrigin}${path}`;
}
