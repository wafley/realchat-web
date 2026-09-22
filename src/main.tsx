import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { initOneSignal, promptPushSubscribe, diagnosePushSupport } from './services/onesignal';
import './styles/globals.css';

// Bersihkan service worker legacy/sw.js yang sudah tidak dipakai dan bisa
// menghalangi pembuatan push subscription token. Satu-satunya SW yang benar
// untuk OneSignal v16 adalah OneSignalSDKWorker.js. JANGAN jalankan di native.
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      if (reg.active && reg.active.scriptURL.endsWith('/OneSignalSDKWorker.js')) return;
      reg.unregister().catch(() => {});
    });
  });
}

// Web push (browser/PWA) — skip di native, native pakai onesignal.native.ts via OneSignal Cordova plugin
if (!Capacitor.isNativePlatform()) {
  void initOneSignal().then(() => {
    window.setTimeout(() => {
      void promptPushSubscribe(true);
      void diagnosePushSupport();
    }, 3000);
  });
}

if (Capacitor.isNativePlatform()) {
  // OneSignal native init — must run before auth, handles FCM token via google-services.json
  import('./services/onesignal.native').then(({ initNativeOneSignal, requestNativePermission }) => {
    void initNativeOneSignal().then(() => {
      window.setTimeout(() => void requestNativePermission(), 2500);
    });
  });

  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setOverlaysWebView({ overlay: true });
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#09090b' });
  });

  import('@capacitor/app').then(({ App }) => {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      }
    });

    // Handle OAuth deep link: com.hallowok.app://auth/callback?token=...
    // Closes Custom Tab, stores tokens, syncs auth, navigates to app root.
    App.addListener('appUrlOpen', async ({ url }) => {
      try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'auth' || !parsed.pathname.startsWith('/callback')) return;

        // Close the in-app browser if still open
        try {
          const { Browser } = await import('@capacitor/browser');
          await Browser.close();
        } catch {}

        const token = parsed.searchParams.get('token');
        const refreshToken = parsed.searchParams.get('refreshToken');
        const error = parsed.searchParams.get('error');

        if (error || !token) {
          window.location.hash = '#/login';
          window.location.href = '/login' + (error ? `?error=${error}` : '');
          return;
        }

        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

        const { getMe } = await import('@/services/auth');
        const user = await getMe();
        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.setState({ user, token, isAuthenticated: true, isLoading: false });

        // Auto-sync: go to home, let ProtectedRoute/AppLayout handle modal close
        window.location.href = '/';
      } catch (e) {
        console.error('appUrlOpen handling failed', e);
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
