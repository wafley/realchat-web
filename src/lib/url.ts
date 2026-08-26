const WEB_API_URL = import.meta.env.VITE_API_URL ?? '/api';
const WEB_SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000';
const NATIVE_API_URL = import.meta.env.VITE_NATIVE_API_URL ?? '';
const NATIVE_SOCKET_URL = import.meta.env.VITE_NATIVE_SOCKET_URL ?? '';

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
 * Converts file paths returned by the API (for example `/uploads/avatar.jpg`)
 * into a URL that also works inside Capacitor's local WebView.
 */
export function resolveFileUrl(value?: string | null): string | undefined {
  if (!value) return undefined;

  // Object URLs are used for the edit-preview and already contain their origin.
  if (/^(data:|blob:)/i.test(value)) return value;

  const native = isNativeApp();
  const apiUrl = getApiUrl();

  if (/^https?:\/\//i.test(value)) {
    // Older backend records can contain `http://localhost:3000/uploads/...`.
    // That works in a desktop browser but points to the phone itself in an APK.
    // Replace only local-host URLs on native platforms; external image URLs and
    // all desktop-browser URLs are deliberately left unchanged.
    if (native && /^https?:\/\//i.test(apiUrl)) {
      const source = new URL(value);
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(source.hostname)) {
        return `${new URL(apiUrl).origin}${source.pathname}${source.search}${source.hash}`;
      }
    }
    return value;
  }

  const path = value.startsWith('/') ? value : `/${value}`;

  // Browser stays relative so Vite/reverse-proxy keeps serving `/uploads` as
  // before. Only Capacitor needs the absolute backend address.
  if (native && /^https?:\/\//i.test(apiUrl)) {
    return `${new URL(apiUrl).origin}${path}`;
  }

  return path;
}
import { Capacitor } from '@capacitor/core';
