// hooks/usePushNotifications.js
import { useEffect } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '../firebase'
import api from '../api/axios'
import toast from 'react-hot-toast'

const usePushNotifications = (user) => {
    useEffect(() => {
        // Only run when a user is logged in
        if (!user) {
            console.log('No user, skipping push notifications setup')
            return
        }

        const setupPush = async () => {
            try {
                console.log('Setting up push notifications for user:', user.id)

                const token = await requestNotificationPermission()
                if (!token) {
                    console.log('No FCM token obtained')
                    return
                }

                console.log('Saving FCM token to backend:', token)

                // Fix: Use correct endpoint path (without /api prefix if backend doesn't have it)
                // Option 1: If your backend has /api prefix in URLs
                await api.post('/notifications/save-token/', { token })

                // Option 2: If your backend doesn't have /api prefix
                // await api.post('/save-token/', { token })

                console.log('✅ FCM token saved successfully')
            } catch (err) {
                // Log more details about the error
                console.error('Push setup failed:', err.response?.data || err.message)
                // Fail silently — notifications are optional
            }
        }

        setupPush()

        // Listen for messages while app is open (foreground)
        const unsubscribe = onForegroundMessage((payload) => {
            console.log('Foreground notification payload:', payload)

            const title = payload.notification?.title || 'FoodCourt'
            const body = payload.notification?.body || ''
            const type = payload.data?.type

            // Show an in-app toast for foreground messages
            if (type === 'NEW_ORDER') {
                toast.success(`🛎️ ${body}`, { duration: 6000 })
            } else if (type === 'ORDER_UPDATE') {
                toast(`📦 ${body}`, { icon: '🍽️', duration: 6000 })
            } else if (type === 'NEW_MENU_ITEM') {
                toast(`✨ ${body}`, { duration: 5000 })
            } else if (body) {
                toast(body)
            }
        })

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe()
        }
    }, [user])
}

export default usePushNotifications