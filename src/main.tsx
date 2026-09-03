import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { initOneSignal, promptPushSubscribe, diagnosePushSupport } from './services/onesignal';
import './styles/globals.css';

// Bersihkan service worker legacy/sw.js yang sudah tidak dipakai dan bisa
// menghalangi pembuatan push subscription token. Satu-satunya SW yang benar
// untuk OneSignal v16 adalah OneSignalSDKWorker.js.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      if (reg.active && reg.active.scriptURL.endsWith('/OneSignalSDKWorker.js')) return;
      reg.unregister().catch(() => {});
    });
  });
}

void initOneSignal().then(() => {
  window.setTimeout(() => {
    void promptPushSubscribe(true);
    void diagnosePushSupport();
  }, 3000);
});

if (Capacitor.isNativePlatform()) {
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
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
