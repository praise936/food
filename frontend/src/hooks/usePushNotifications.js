// hooks/usePushNotifications.js
// Called once after login — requests permission, gets FCM token,
// saves it to backend, listens for foreground messages

import { useEffect } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '../firebase'
import api from '../api/axios'
import toast from 'react-hot-toast'

const usePushNotifications = (user) => {
    useEffect(() => {
        // Only run when a user is logged in
        if (!user) return

        const setupPush = async () => {
            try {
                const token = await requestNotificationPermission()
                if (!token) return

                // Save the FCM token to the backend so we can push to this device
                await api.post('/notifications/save-token/', { token })
                console.log('✅ FCM token saved')
            } catch (err) {
                // Fail silently — notifications are optional
                console.log('Push setup failed silently:', err)
            }
        }

        setupPush()

        // Listen for messages while app is open (foreground)
        const unsubscribe = onForegroundMessage((payload) => {
            const title = payload.notification?.title || 'FoodCourt'
            const body = payload.notification?.body || ''
            const type = payload.data?.type

            // Show an in-app toast for foreground messages
            // (Background messages are shown by the service worker as OS notifications)
            if (type === 'NEW_ORDER') {
                toast.success(`🛎️ ${body}`, { duration: 6000 })
            } else if (type === 'ORDER_UPDATE') {
                toast(`📦 ${body}`, { icon: '🍽️', duration: 6000 })
            } else if (type === 'NEW_MENU_ITEM') {
                toast(`✨ ${body}`, { duration: 5000 })
            } else {
                toast(body)
            }
        })

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe()
        }
    }, [user])
}

export default usePushNotifications