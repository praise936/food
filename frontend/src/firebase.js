// firebase.js — Firebase app initialisation and FCM setup

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

// Initialise Firebase
const app = initializeApp(firebaseConfig)

// Get messaging instance
export const messaging = getMessaging(app)

// Your VAPID public key from Firebase console
const VAPID_KEY = "BMKwxxPrKhQTb36kRLbXgffhwWrnZD6W9XcfR55yXg2iicbYqvG2ZLmw82KcRYfQqgv5l-14_YqUkf-Uta98nwl"

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

        // Get FCM registration token
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
        })

        return token
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
        callback(payload)
    })
}