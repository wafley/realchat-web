import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { router } from './routes';
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

  // Native status bar styling is synced dynamically with the active theme in themeStore.ts.

  import('@capacitor/app').then(({ App }) => {
    let backPressCount = 0;
    let backPressTimer: number | undefined;

    App.addListener('backButton', ({ canGoBack }) => {
      const pathname = router.state.location.pathname;
      const isRootPage = pathname === '/' || pathname === '/login';

      if (!isRootPage && canGoBack) {
        backPressCount = 0;
        window.history.back();
        return;
      }

      backPressCount += 1;
      if (backPressTimer) window.clearTimeout(backPressTimer);

      const nativeBridge = (
        window as Window & { HalloWokNative?: { vibrate?: (ms: number) => void } }
      ).HalloWokNative;
      if (nativeBridge?.vibrate) {
        nativeBridge.vibrate(25);
      } else {
        navigator.vibrate?.(25);
      }

      if (backPressCount >= 3) {
        backPressCount = 0;
        void App.exitApp();
        return;
      }

      const remaining = 3 - backPressCount;
      void import('sonner').then(({ toast }) => {
        toast.info(`Tekan kembali ${remaining}x lagi untuk keluar`, {
          id: 'exit-app-toast',
          duration: 1800,
        });
      });

      backPressTimer = window.setTimeout(() => {
        backPressCount = 0;
      }, 2000);
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
        const userParam = parsed.searchParams.get('user');

        if (error || !token) {
          router.navigate('/login' + (error ? `?error=${error}` : ''), { replace: true });
          return;
        }

        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

        let user: any = null;
        if (userParam) {
          try {
            user = JSON.parse(decodeURIComponent(userParam));
          } catch {}
        }

        try {
          const { getMe } = await import('@/services/auth');
          const fullUser = await getMe();
          if (fullUser) user = fullUser;
        } catch (err) {
          console.warn('[OAuth deep link] getMe failed, falling back to callback user:', err);
        }

        if (user) {
          localStorage.setItem('authUser', JSON.stringify(user));
        }

        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.setState({ user, token, isAuthenticated: true, isLoading: false });

        // Navigate cleanly to home without triggering a full-page webview reload
        try {
          await router.navigate('/', { replace: true });
        } catch {
          window.location.replace('/');
        }
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
