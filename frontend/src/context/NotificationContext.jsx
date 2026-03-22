// context/NotificationContext.jsx — Notifications with HTTP polling
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [lastSeenId, setLastSeenId] = useState(null)
    const [isPolling, setIsPolling] = useState(false)
    const pollingInterval = useRef(null)

    // Show toast notification based on message type
    const showNotificationToast = useCallback((notification) => {
        const { type, title, message, data } = notification

        switch (type) {
            case 'NEW_ORDER':
                toast.success(`🛎️ ${title || 'New Order'}!`)
                break
            case 'ORDER_STATUS_UPDATE':
                toast(`📦 ${title || 'Order Update'}`, {
                    icon: '🍽️',
                })
                break
            case 'NEW_MENU_ITEM':
                toast(`🆕 ${title || 'New Menu Item'}`, {
                    icon: '✨',
                })
                break
            case 'ORDER_READY':
                toast.success(`✅ ${title || 'Order Ready'}!`)
                break
            case 'ORDER_PICKED_UP':
                toast(`🛵 ${title || 'Order Picked Up'}`, {
                    icon: '✅',
                })
                break
            default:
                toast(message || 'New notification')
        }
    }, [])

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!user) return

        try {
            const response = await api.get('/notifications/')
            const newNotifications = response.data

            setNotifications(prevNotifications => {
                const existingIds = new Set(prevNotifications.map(n => n.id))
                const freshNotifications = newNotifications.filter(n => !existingIds.has(n.id))

                if (freshNotifications.length > 0) {
                    // Calculate new unread count
                    const newUnreadCount = freshNotifications.filter(n => !n.read).length
                    if (newUnreadCount > 0) {
                        setUnreadCount(prev => prev + newUnreadCount)

                        // Show toast for each new notification
                        freshNotifications.forEach(notification => {
                            if (!notification.read) {
                                showNotificationToast(notification)
                            }
                        })
                    }

                    return [...freshNotifications, ...prevNotifications]
                }
                return prevNotifications
            })
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        }
    }, [user, showNotificationToast])

    // Start polling for notifications
    const startPolling = useCallback(() => {
        if (!user || pollingInterval.current) return

        setIsPolling(true)

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
        setIsPolling(false)
    }, [])

    // Start/stop polling based on auth
    useEffect(() => {
        if (user) {
            startPolling()
        } else {
            stopPolling()
            setNotifications([])
            setUnreadCount(0)
            setLastSeenId(null)
        }

        return () => {
            stopPolling()
        }
    }, [user, startPolling, stopPolling])

    // Handle visibility change (refresh when tab becomes visible)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                // Refresh notifications when user returns to tab
                fetchNotifications()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [user, fetchNotifications])

    // Mark all notifications as read
    const markAllRead = useCallback(async () => {
        try {
            await api.post('/notifications/mark-all-read/')

            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)

            if (notifications.length > 0) {
                setLastSeenId(notifications[0].id)
            }
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
            await api.delete('/notifications/clear/')  // Match backend URL

            setNotifications([])
            setUnreadCount(0)
            setLastSeenId(null)
            toast.success('All notifications cleared')
        } catch (error) {
            console.error('Failed to clear notifications:', error)
            toast.error('Failed to clear notifications')
        }
    }, [])

    // Manual refresh
    const refreshNotifications = useCallback(async () => {
        await fetchNotifications()
        toast.success('Notifications refreshed')
    }, [fetchNotifications])

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            lastSeenId,
            isPolling,
            markAllRead,
            markAsRead,
            clearNotifications,
            refreshNotifications,
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used inside NotificationProvider')
    }
    return context
}