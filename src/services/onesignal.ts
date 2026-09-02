/**
 * Integrasi push notification via OneSignal Web SDK.
 * Diload dari CDN di index.html (OneSignalSDK.page.js) dan di-init di sana.
 * Wrapper ini menangani menunggu SDK siap, menghubungkan user (external_id),
 * izin notifikasi, dan registrasi subscription id ke backend (best-effort).
 */
import api from '@/lib/api';

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

/** Tipe global OneSignal yang disuntikkan oleh script CDN di index.html. */
interface OneSignalAPI {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  Slidedown: {
    promptPush: (options?: { force?: boolean }) => Promise<void>;
  };
  User: {
    addAlias: (key: string, value: string) => Promise<void>;
    removeAlias: (key: string) => Promise<void>;
    PushSubscription: {
      id: string | null;
      optedIn: boolean;
      optIn: () => Promise<void>;
      optOut: () => Promise<void>;
      addEventListener: (event: string, cb: (event: any) => void) => void;
    };
  };
  Notifications: {
    permission: boolean;
    requestPermission: (fallbackToSettings?: boolean) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalAPI) => unknown>;
  }
}

let readyPromise: Promise<OneSignalAPI | null> | null = null;
let debugListenerAttached = false;

/**
 * Menunggu SDK OneSignal siap dan mengembalikan instance-nya.
 * SDK di-inisialisasi (init) di index.html; fungsi ini hanya menunggu siap.
 */
function resolveOneSignal(): Promise<OneSignalAPI | null> {
  if (!APP_ID) return Promise.resolve(null);
  if (!readyPromise) {
    readyPromise = new Promise((resolve) => {
      const attach = (OneSignal: OneSignalAPI) => {
        if (!debugListenerAttached && OneSignal.User?.PushSubscription) {
          debugListenerAttached = true;
          OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
            console.log(
              '[onesignal:debug] subscription change:',
              JSON.stringify({
                id: event?.current?.id ?? null,
                token: event?.current?.token ?? null,
                optedIn: event?.current?.optedIn ?? false,
                prevOptedIn: event?.previous?.optedIn ?? null,
              }),
            );
          });
        }
        resolve(OneSignal);
      };
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(attach);
      } else {
        (window.OneSignalDeferred = [attach]).push(function () {});
      }
    });
  }
  return readyPromise;
}

/** Menunggu SDK OneSignal siap (dipakai sekali saat startup). */
export function initOneSignal(): Promise<OneSignalAPI | null> {
  return resolveOneSignal();
}

export function isOneSignalSupported(): boolean {
  return Boolean(APP_ID);
}

/** Menautkan pengguna aplikasi ke identity OneSignal (agar push dapat ditarget). */
export async function setExternalUserId(userId: string): Promise<void> {
  if (!isOneSignalSupported() || !userId) return;
  const OneSignal = await initOneSignal();
  if (!OneSignal) return;
  try {
    await OneSignal.login(userId);
    console.log(
      `[onesignal] login OK user=${userId} optedIn=${OneSignal.User?.PushSubscription?.optedIn ?? false} id=${OneSignal.User?.PushSubscription?.id ?? 'null'}`,
    );
  } catch (err) {
    console.error('[onesignal] setExternalUserId failed:', err);
  }
}

/** Melepas tautan pengguna dari identity OneSignal (panggil saat logout). */
export async function removeExternalUserId(): Promise<void> {
  if (!isOneSignalSupported()) return;
  const OneSignal = await initOneSignal();
  if (!OneSignal) return;
  try {
    await OneSignal.logout();
  } catch (err) {
    console.error('[onesignal] removeExternalUserId failed:', err);
  }
}

/** Meminta izin notifikasi push kepada pengguna & memastikan subscription aktif. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isOneSignalSupported()) return false;
  const OneSignal = await initOneSignal();
  if (!OneSignal) return false;
  try {
    let granted = await OneSignal.Notifications.requestPermission(true);
    const sub = OneSignal.User?.PushSubscription;
    if (granted && sub && !sub.optedIn) {
      try {
        await sub.optIn();
        granted = true;
      } catch {
        /* abaikan */
      }
    }
    console.log(
      `[onesignal] permission granted=${granted} optedIn=${sub?.optedIn ?? false} id=${sub?.id ?? 'null'}`,
    );
    return granted;
  } catch (err) {
    console.error('[onesignal] requestPermission failed:', err);
    return false;
  }
}

/** Menampilkan prompt slidedown subscribe secara manual (force mengabaikan back-off). */
export async function promptPushSubscribe(force = true): Promise<void> {
  if (!isOneSignalSupported()) return;
  const OneSignal = await initOneSignal();
  if (!OneSignal?.Slidedown) return;
  try {
    await OneSignal.Slidedown.promptPush({ force });
    console.log('[onesignal] promptPush triggered');
  } catch (err) {
    console.error('[onesignal] promptPush failed:', err);
  }
}

/** Mendapatkan subscription id web push (null bila belum aktif). */
export async function getPushSubscriptionId(): Promise<string | null> {
  if (!isOneSignalSupported()) return null;
  const OneSignal = await initOneSignal();
  if (!OneSignal) return null;
  return OneSignal.User?.PushSubscription?.id ?? null;
}

/** Mendiagnosa apakah browser bisa menerbitkan push subscription (cek secure context & SW). */
export async function diagnosePushSupport(): Promise<Record<string, unknown>> {
  const info: Record<string, unknown> = {
    secureContext: window.isSecureContext,
    protocol: window.location.protocol,
    permission: 'Notification' in window ? Notification.permission : 'n/a',
    oneSignalSupported: isOneSignalSupported(),
  };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      info.swActive = true;
      info.swScope = reg.scope;
      if (reg.active) info.swScript = reg.active.scriptURL;
      const sub = await reg.pushManager.getSubscription();
      info.pushSubscription = sub ? { endpoint: sub.endpoint } : null;
    } else {
      info.swActive = false;
    }
  } catch (err) {
    info.swActive = false;
    info.swError = String(err);
  }
  console.log('[onesignal:debug] push diagnose:', JSON.stringify(info, null, 2));
  return info;
}

/** Mendaftarkan subscription id ke backend (best-effort, gagal diam-diam). */
export async function registerPushDevice(): Promise<void> {
  if (!isOneSignalSupported()) return;
  try {
    const subscriptionId = await getPushSubscriptionId();
    if (!subscriptionId) return;
    await api.post('/devices', { token: subscriptionId, platform: 'web' });
  } catch (err) {
    console.error('[onesignal] registerPushDevice failed:', err);
  }
}

/** Menghapus subscription id dari backend (best-effort). */
export async function unregisterPushDevice(): Promise<void> {
  if (!isOneSignalSupported()) return;
  try {
    const subscriptionId = await getPushSubscriptionId();
    if (!subscriptionId) return;
    await api.delete('/devices', { data: { token: subscriptionId } });
  } catch (err) {
    console.error('[onesignal] unregisterPushDevice failed:', err);
  }
}
