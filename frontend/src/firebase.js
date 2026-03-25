// firebase.js
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
    apiKey: "AIzaSyCVWFU9jwXZDHP0isCnZCMQYoBZOnTkHMw",
    authDomain: "foodcourt-45b2d.firebaseapp.com",
    projectId: "foodcourt-45b2d",
    storageBucket: "foodcourt-45b2d.firebasestorage.app",
    messagingSenderId: "1077314425505",
    appId: "1:1077314425505:web:6f502a583a7983fa20d6e0",
    measurementId: "G-0Z332QM2HY"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Get messaging instance
export const messaging = getMessaging(app)

// Your VAPID public key from Firebase console
const VAPID_KEY = "BMKwxxPrKhQTb36kRLbXgffhwWrnZD6W9XcfR55yXg2iicbYqvG2ZLmw82KcRYfQqgv5l-14_YqUkf-Uta98nwI"

/**
 * Request notification permission from the browser.
 * If granted, get the FCM token and return it.
 * Returns null if permission denied.
 */
export const requestNotificationPermission = async () => {
    try {
        // Ask browser for permission
        const permission = await Notification.requestPermission()

        if (permission !== 'granted') {
            console.log('Notification permission denied')
            return null
        }

        // Wait for service worker registration
        let swRegistration;
        try {
            swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
            if (!swRegistration) {
                console.log('Service worker not registered, registering now...')
                swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
                console.log('Service worker registered:', swRegistration)
            }
        } catch (swError) {
            console.error('Service worker registration error:', swError)
            return null
        }

        // Get FCM registration token with service worker
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swRegistration,
        })

        if (token) {
            console.log('FCM token obtained:', token)
            return token
        } else {
            console.log('No FCM token available')
            return null
        }
    } catch (err) {
        console.error('Error getting FCM token:', err)
        return null
    }
}

/**
 * Listen for messages when the app IS in the foreground.
 * Background messages are handled by the service worker.
 */
export const onForegroundMessage = (callback) => {
    return onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload)
        callback(payload)
    })
}