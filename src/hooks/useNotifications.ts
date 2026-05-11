import { useEffect, useState, useCallback } from 'react';
import { messaging, getToken, onMessage, isFirebaseConfigured } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface NotificationMessage {
  title: string;
  body: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );
  const [toast, setToast] = useState<NotificationMessage | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message:', payload);
      if (payload.notification) {
        setToast({
          title: payload.notification.title || 'Đại sứ Giáo dục',
          body: payload.notification.body || '',
        });
        // Auto-dismiss after 6 seconds
        setTimeout(() => setToast(null), 6000);
      }
    });

    return () => unsubscribe();
  }, []);

  // Request permission and save token
  const requestPermission = useCallback(async () => {
    if (!isFirebaseConfigured || !messaging || !db) return;
    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        // Register the FCM service worker
        const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: sw,
        });

        if (token && db) {
          // Save token to Firestore for Admin to send notifications
          await setDoc(doc(db, 'fcm_tokens', token), {
            token,
            createdAt: serverTimestamp(),
            userAgent: navigator.userAgent,
          });
          console.log('[FCM] Token saved:', token.slice(0, 20) + '...');
        }
      }
    } catch (err) {
      console.error('[FCM] Permission error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return { permission, toast, loading, requestPermission, dismissToast };
}
