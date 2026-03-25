// context/NotificationContext.jsx — Notifications (Stubbed - Non-functional)
import React, { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth()

    // Stubbed state - never updates
    const [notifications] = useState([])
    const [unreadCount] = useState(0)
    const [lastSeenId] = useState(null)
    const [isPolling] = useState(false)

    // Stubbed functions - do nothing
    const showNotificationToast = useCallback(() => {
        // Intentionally empty - no toast notifications
    }, [])

    const fetchNotifications = useCallback(async () => {
        // Intentionally empty - no API calls
        return
    }, [])

    const startPolling = useCallback(() => {
        // Intentionally empty - no polling
        return
    }, [])

    const stopPolling = useCallback(() => {
        // Intentionally empty - no cleanup
        return
    }, [])

    // Stubbed effect - does nothing
    // useEffect removed entirely

    const markAllRead = useCallback(async () => {
        // Intentionally empty - no API call
        console.log('Notification functionality is disabled')
    }, [])

    const markAsRead = useCallback(async () => {
        // Intentionally empty - no API call
        console.log('Notification functionality is disabled')
    }, [])

    const clearNotifications = useCallback(async () => {
        // Intentionally empty - no API call
        console.log('Notification functionality is disabled')
    }, [])

    const refreshNotifications = useCallback(async () => {
        // Intentionally empty - no API call
        console.log('Notification functionality is disabled')
    }, [])

    // Provide stubbed values and functions
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