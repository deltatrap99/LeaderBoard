// Firebase Messaging Service Worker
// Handles push notifications when the app is in the background

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBWpM1V8fMkueJ69o8aqYjQxzccxz3J0_A',
  authDomain: 'leader-board-b12a7.firebaseapp.com',
  projectId: 'leader-board-b12a7',
  storageBucket: 'leader-board-b12a7.firebasestorage.app',
  messagingSenderId: '10426315676',
  appId: '1:10426315676:web:c1d0a5c81c5b1cd7f3ce59',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const title = payload.notification?.title || 'Đại sứ Giáo dục';
  const options = {
    body: payload.notification?.body || 'Bạn có thông báo mới!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: payload.data?.url || '/',
    },
  };

  self.registration.showNotification(title, options);
});

// Handle notification click → open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
