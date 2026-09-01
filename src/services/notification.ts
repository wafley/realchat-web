const SW_PATH = '/OneSignalSDKWorker.js';

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  const permission = await Notification.requestPermission();
  return permission;
}

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!isNotificationSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH);
    return reg;
  } catch {
    return null;
  }
}

export async function showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, options);
  } catch {
    new Notification(title, options);
  }
}

const STORAGE_KEY = 'hallo-wok-notification-prefs';

export interface NotificationPrefs {
  messages: boolean;
  groups: boolean;
  sound: boolean;
}

export function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { messages: true, groups: true, sound: false };
}

export function savePrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
