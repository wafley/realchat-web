import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import api from '@/lib/api';
import { getMessagingInstance, isFirebaseConfigured } from '@/config/firebase';
import { registerSW, showLocalNotification, loadPrefs } from '@/services/notification';
import { useNotificationStore } from '@/store/notificationStore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let registeredToken: string | null = null;

export function getRegisteredToken(): string | null {
  return registeredToken;
}

async function registerDevice(token: string): Promise<void> {
  await api.post('/devices', { token, platform: 'web' });
}

async function unregisterDevice(token: string): Promise<void> {
  try {
    await api.delete('/devices', { data: { token } });
  } catch {
    // Best-effort: ignore cleanup failures.
  }
}

async function requestToken(registration: ServiceWorkerRegistration): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;
  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY || undefined,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (error) {
    console.error('[fcm] failed to get token:', error);
    return null;
  }
}

export async function registerPushNotifications(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  if (typeof Notification === 'undefined') return null;
  if (Notification.permission === 'denied') return null;

  const registration = await registerSW();
  if (!registration) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const token = await requestToken(registration);
  if (!token) return null;

  registeredToken = token;
  try {
    await registerDevice(token);
  } catch (error) {
    console.error('[fcm] failed to register device:', error);
  }
  return token;
}

export async function unregisterPushNotifications(): Promise<void> {
  if (registeredToken) {
    await unregisterDevice(registeredToken);
    registeredToken = null;
  }
}

export async function setupForegroundMessageListener(): Promise<void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return;
  onMessage(messaging, (payload: MessagePayload) => {
    const prefs = loadPrefs();
    const data = payload.data ?? {};
    const isGroup = data.type === 'group';
    if (isGroup && !prefs.groups) return;
    if (!isGroup && !prefs.messages) return;

    useNotificationStore.getState().addNotification({
      id: data.messageId ?? `${Date.now()}`,
      type: isGroup ? 'group' : 'message',
      title: payload.notification?.title ?? data.senderName ?? 'New message',
      body: payload.notification?.body ?? data.body ?? '',
      read: false,
      conversationId: data.conversationId,
      sender: data.senderId ? { id: data.senderId, username: data.senderName ?? '' } : undefined,
      createdAt: new Date(),
    });

    showLocalNotification(payload.notification?.title ?? data.senderName ?? 'New message', {
      body: payload.notification?.body ?? data.body ?? '',
      data: { url: buildNotificationUrl(data) },
    });
  });
}

export function buildNotificationUrl(data: Record<string, string>): string {
  const conversationId = data.conversationId;
  if (!conversationId) return '/';
  return data.type === 'group' ? `/chat/${conversationId}` : `/dm/${conversationId}`;
}
