// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Same config as frontend
firebase.initializeApp({
    apiKey: "AIzaSyCVWFU9jwXZDHP0isCnZCMQYoBZOnTkHMw",
    authDomain: "foodcourt-45b2d.firebaseapp.com",
    projectId: "foodcourt-45b2d",
    storageBucket: "foodcourt-45b2d.firebasestorage.app",
    messagingSenderId: "1077314425505",
    appId: "1:1077314425505:web:6f502a583a7983fa20d6e0",
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload)

    const notificationTitle =
        payload.notification?.title || payload.data?.title || 'FoodCourt'

    const notificationOptions = {
        body:
            payload.notification?.body || payload.data?.body || '',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: payload.data || {},
    }

    self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus()
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow('/')
            }
        })
    )
})