import { initializeApp, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported as isMessagingSupported, type Messaging } from 'firebase/messaging';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  if (DEV_MODE) return false;
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId && config.messagingSenderId && config.appId);
}

let messagingInstance: Messaging | null | undefined;

export async function getMessagingInstance(): Promise<Messaging | null> {
  if (!isFirebaseConfigured()) return null;
  if (messagingInstance !== undefined) return messagingInstance;
  try {
    const supported = await isMessagingSupported();
    if (!supported) {
      messagingInstance = null;
      return null;
    }
    let app: FirebaseApp;
    try {
      app = getApp();
    } catch {
      app = initializeApp(getFirebaseConfig());
    }
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error('[fcm] failed to init messaging:', error);
    messagingInstance = null;
    return null;
  }
}
