/**
 * Bridge OneSignal Native untuk Capacitor Android (via onesignal-cordova-plugin@5.x).
 * Dipakai hanya saat Capacitor.isNativePlatform() == true.
 * Web push tetap via src/services/onesignal.ts (Web SDK v16).
 */
import { Capacitor } from '@capacitor/core';
import api from '@/lib/api';

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

declare global {
  interface Window {
    plugins?: {
      OneSignal?: any;
    };
    OneSignal?: any;
  }
}

function getNativeOneSignal(): any | null {
  if (!Capacitor.isNativePlatform()) return null;
  return window.plugins?.OneSignal ?? window.OneSignal ?? null;
}

function isNativeReady(): boolean {
  return Capacitor.isNativePlatform() && Boolean(APP_ID) && Boolean(getNativeOneSignal());
}

/**
 * Init OneSignal native. Panggil sekali di main.tsx saat isNativePlatform().
 * Set log level, init App ID, dan pasang click listener untuk deep link.
 */
export async function initNativeOneSignal(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !APP_ID) return;
  const OneSignal = getNativeOneSignal();
  if (!OneSignal) {
    console.warn('[onesignal:native] plugin not found — did npx cap sync run?');
    return;
  }

  try {
    // 5.x API: setAppId + setLaunchURLsInApp + inFocusDisplaying
    if (typeof OneSignal.setAppId === 'function') {
      OneSignal.setAppId(APP_ID);
    } else if (typeof OneSignal.initialize === 'function') {
      OneSignal.initialize(APP_ID);
    }

    if (typeof OneSignal.setLaunchURLsInApp === 'function') {
      OneSignal.setLaunchURLsInApp(false);
    }
    if (typeof OneSignal.promptForPushNotificationsWithUserResponse === 'function') {
      // auto-prompt handled separately via requestNativePermission()
    }

    // Click handler: data = { conversationId, messageId, type, senderId, senderName, url }
    const handleClick = (result: any) => {
      try {
        const data = result?.notification?.additionalData ?? result?.additionalData ?? {};
        const conversationId: string | undefined = data.conversationId;
        const url: string | undefined = data.url;
        if (url) {
          window.location.hash = `#${url}`;
          // fallback: Capacitor App tidak pakai hash router? Coba href juga
          if (url.startsWith('/')) window.location.href = url;
          return;
        }
        if (conversationId) {
          const type = data.type === 'group' ? 'group' : 'dm';
          const target = type === 'group' ? `/chat/${conversationId}` : `/dm/${conversationId}`;
          window.location.href = target;
        }
      } catch (e) {
        console.error('[onesignal:native] click handler failed', e);
      }
    };

    if (typeof OneSignal.setNotificationOpenedHandler === 'function') {
      OneSignal.setNotificationOpenedHandler(handleClick);
    } else if (typeof OneSignal.Notifications?.addEventListener === 'function') {
      OneSignal.Notifications.addEventListener('click', handleClick);
    } else if (typeof OneSignal.addEventListener === 'function') {
      OneSignal.addEventListener('click', handleClick);
    }

    console.log('[onesignal:native] initialized appId=' + APP_ID);
  } catch (err) {
    console.error('[onesignal:native] init failed', err);
  }
}

/**
 * Login external_id ke OneSignal native (agar push bisa via include_aliases.external_id).
 */
export async function setNativeExternalUserId(userId: string): Promise<void> {
  if (!isNativeReady() || !userId) return;
  const OneSignal = getNativeOneSignal();
  try {
    if (typeof OneSignal.login === 'function') {
      await OneSignal.login(userId);
    } else if (typeof OneSignal.setExternalUserId === 'function') {
      await OneSignal.setExternalUserId(userId);
    }
    console.log('[onesignal:native] login OK user=' + userId);
  } catch (err) {
    console.error('[onesignal:native] login failed', err);
  }
}

export async function removeNativeExternalUserId(): Promise<void> {
  if (!isNativeReady()) return;
  const OneSignal = getNativeOneSignal();
  try {
    if (typeof OneSignal.logout === 'function') await OneSignal.logout();
    else if (typeof OneSignal.removeExternalUserId === 'function') await OneSignal.removeExternalUserId();
  } catch (err) {
    console.error('[onesignal:native] logout failed', err);
  }
}

/**
 * Minta permission POST_NOTIFICATIONS (Android 13+). Return true jika granted.
 */
export async function requestNativePermission(): Promise<boolean> {
  if (!isNativeReady()) return false;
  const OneSignal = getNativeOneSignal();
  try {
    if (typeof OneSignal.Notifications?.requestPermission === 'function') {
      const granted = await OneSignal.Notifications.requestPermission(true);
      return Boolean(granted);
    }
    if (typeof OneSignal.promptForPushNotificationsWithUserResponse === 'function') {
      return await new Promise<boolean>((resolve) => {
        OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => resolve(accepted));
      });
    }
    if (typeof OneSignal.promptForPushNotifications === 'function') {
      OneSignal.promptForPushNotifications();
      return true;
    }
    return true;
  } catch (err) {
    console.error('[onesignal:native] requestPermission failed', err);
    return false;
  }
}

export async function getNativeSubscriptionId(): Promise<string | null> {
  if (!isNativeReady()) return null;
  const OneSignal = getNativeOneSignal();
  try {
    if (typeof OneSignal.User?.pushSubscription?.getIdAsync === 'function') {
      return (await OneSignal.User.pushSubscription.getIdAsync()) ?? null;
    }
    if (typeof OneSignal.getDeviceState === 'function') {
      const state: any = await new Promise((resolve) => OneSignal.getDeviceState(resolve));
      return state?.userId ?? state?.subscriptionId ?? null;
    }
    return OneSignal.User?.pushSubscription?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Daftarkan subscription id native ke BE (platform android).
 * Dipanggil setelah login + setelah permission granted.
 */
export async function registerNativePushDevice(): Promise<void> {
  if (!isNativeReady()) return;
  try {
    const subscriptionId = await getNativeSubscriptionId();
    if (!subscriptionId) {
      console.log('[onesignal:native] no subscription id yet (permission not granted?)');
      return;
    }
    await api.post('/devices', { token: subscriptionId, platform: 'android' });
    console.log('[onesignal:native] registerPushDevice OK token=' + subscriptionId.slice(0, 8) + '...');
  } catch (err) {
    console.error('[onesignal:native] registerPushDevice failed', err);
  }
}

export async function unregisterNativePushDevice(): Promise<void> {
  if (!isNativeReady()) return;
  try {
    const subscriptionId = await getNativeSubscriptionId();
    if (!subscriptionId) return;
    await api.delete('/devices', { data: { token: subscriptionId } });
  } catch (err) {
    console.error('[onesignal:native] unregister failed', err);
  }
}

export function isNativeOneSignalSupported(): boolean {
  return Capacitor.isNativePlatform() && Boolean(APP_ID);
}
