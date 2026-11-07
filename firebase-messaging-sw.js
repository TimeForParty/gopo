importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCSqIewoV7YYhjJ6mx_jygVH4Ap4U7gAgs",
  authDomain: "gopo-2b629.firebaseapp.com",
  projectId: "gopo-2b629",
  storageBucket: "gopo-2b629.firebasestorage.app",
  messagingSenderId: "860909387262",
  appId: "1:860909387262:web:1f55d6aed6c51b113614af"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title || 'GoPo ❄️', {
    body: payload.notification?.body || '',
    icon: '/icon-192.png'
  });
});
