// context/NotificationContext.jsx — Notifications with HTTP polling
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
// REMOVED: import { addMessageListener } from '../api/websocket'
import { useAuth } from './AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])  // list of all notifications
    const [unreadCount, setUnreadCount] = useState(0)
    const [lastSeenId, setLastSeenId] = useState(null)
    const pollingInterval = useRef(null)
    const [isPolling, setIsPolling] = useState(false)

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!user) return

        try {
            const response = await api.get('/notifications/')
            const newNotifications = response.data

            // Check for new notifications
            if (newNotifications.length > 0) {
                // Find notifications that are new (not in current state)
                const existingIds = new Set(notifications.map(n => n.id))
                const freshNotifications = newNotifications.filter(n => !existingIds.has(n.id))

                if (freshNotifications.length > 0) {
                    // Add new notifications to the list
                    setNotifications(prev => [...freshNotifications, ...prev])

                    // Update unread count (mark as unread if they're new)
                    const newUnreadCount = freshNotifications.filter(n => !n.read).length
                    if (newUnreadCount > 0) {
                        setUnreadCount(prev => prev + newUnreadCount)

                        // Show toast for each new notification
                        freshNotifications.forEach(notification => {
                            showNotificationToast(notification)
                        })
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
            // Don't show error toast to avoid spamming users
        }
    }, [user, notifications])

    // Show toast notification based on message type
    const showNotificationToast = (notification) => {
        if (notification.type === 'NEW_ORDER') {
            toast.success(`🛎️ New order from ${notification.order?.customer_name || 'a customer'}!`)
        } else if (notification.type === 'ORDER_STATUS_UPDATE') {
            toast(`📦 Order #${notification.order?.id} is now: ${notification.order?.status_display}`, {
                icon: '🍽️',
            })
        } else if (notification.type === 'NEW_MENU_ITEM') {
            toast(`🆕 ${notification.restaurant_name} added: ${notification.item?.name}`, {
                icon: '✨',
            })
        } else if (notification.type === 'ORDER_READY') {
            toast.success(`✅ Order #${notification.order?.id} is ready for pickup!`)
        } else if (notification.type === 'ORDER_PICKED_UP') {
            toast(`🛵 Order #${notification.order?.id} has been picked up`)
        }
    }

    // Start polling for notifications
    const startPolling = useCallback(() => {
        if (!user || pollingInterval.current) return

        // Initial fetch
        fetchNotifications()

        // Poll every 30 seconds for new notifications
        pollingInterval.current = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchNotifications()
            }
        }, 30000) // 30 seconds
    }, [user, fetchNotifications])

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current)
            pollingInterval.current = null
        }
    }, [])

    // Start/stop polling based on auth and visibility
    useEffect(() => {
        if (user) {
            startPolling()
        } else {
            stopPolling()
            setNotifications([])
            setUnreadCount(0)
        }

        return () => {
            stopPolling()
        }
    }, [user, startPolling, stopPolling])

    // Handle visibility change (stop polling when tab is hidden)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                // Refresh notifications when tab becomes visible
                fetchNotifications()
                startPolling()
            } else if (document.visibilityState === 'hidden') {
                // Optionally stop polling when tab is hidden to save resources
                // stopPolling() // Uncomment if you want to save battery
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [user, fetchNotifications, startPolling, stopPolling])

    // Mark all notifications as read
    const markAllRead = useCallback(async () => {
        try {
            // Update on server
            await api.post('/notifications/mark-all-read/')

            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
            setLastSeenId(notifications[0]?.id || null)
        } catch (error) {
            console.error('Failed to mark notifications as read:', error)
        }
    }, [notifications])

    // Mark single notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await api.post(`/notifications/${notificationId}/read/`)

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }, [])

    // Clear all notifications
    const clearNotifications = useCallback(async () => {
        try {
            await api.delete('/notifications/')
            setNotifications([])
            setUnreadCount(0)
            setLastSeenId(null)
        } catch (error) {
            console.error('Failed to clear notifications:', error)
        }
    }, [])

    // Manual refresh (can be triggered by user)
    const refreshNotifications = useCallback(() => {
        fetchNotifications()
    }, [fetchNotifications])

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAllRead,
            markAsRead,
            clearNotifications,
            refreshNotifications,
            isPolling,
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) throw new Error('useNotifications must be used inside NotificationProvider')
    return context
}