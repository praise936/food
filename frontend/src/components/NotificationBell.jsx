// components/NotificationBell.jsx — Bell icon with dropdown
import React, { useState, useRef, useEffect } from 'react'
import { Bell, RefreshCw, CheckCheck } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

const NotificationBell = () => {
    const {
        notifications,
        unreadCount,
        markAllRead,
        clearNotifications,
        refreshNotifications
    } = useNotifications()
    const [open, setOpen] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleOpen = () => {
        setOpen(!open)
        if (!open && unreadCount > 0) {
            // Optionally mark as read when opening dropdown
            // markAllRead()
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await refreshNotifications()
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    const handleMarkAllRead = () => {
        markAllRead()
    }

    const getNotificationIcon = (type) => {
        const icons = {
            'NEW_ORDER': '🛎️',
            'ORDER_STATUS_UPDATE': '📦',
            'NEW_MENU_ITEM': '✨',
            'ORDER_READY': '✅',
            'ORDER_PICKED_UP': '🛵',
            'REVIEW_RESPONSE': '💬'
        }
        return icons[type] || '🔔'
    }

    const getNotificationText = (notif) => {
        switch (notif.type) {
            case 'NEW_ORDER':
                return `New order #${notif.order?.id} from ${notif.order?.customer_name || 'customer'}`
            case 'ORDER_STATUS_UPDATE':
                return `Order #${notif.order?.id}: ${notif.order?.status_display}`
            case 'NEW_MENU_ITEM':
                return `New item: ${notif.item?.name} at ${notif.restaurant_name}`
            case 'ORDER_READY':
                return `Order #${notif.order?.id} is ready for pickup!`
            case 'ORDER_PICKED_UP':
                return `Order #${notif.order?.id} has been picked up`
            default:
                return notif.message || 'New notification'
        }
    }

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                onClick={handleOpen}
                className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Notifications"
            >
                <Bell size={22} className="text-brand-black" />
                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-brand-danger 
                           text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-shiny-lg 
                        border border-gray-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-brand-black">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {/* Refresh button */}
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                aria-label="Refresh notifications"
                            >
                                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>

                            {/* Mark all read button */}
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Mark all as read"
                                >
                                    <CheckCheck size={14} />
                                </button>
                            )}

                            <span className="text-xs text-brand-gray">
                                {notifications.length} total
                            </span>
                        </div>
                    </div>

                    {/* Notifications list */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-brand-gray text-sm">No notifications yet</p>
                                <p className="text-xs text-brand-gray mt-1">
                                    Notifications will appear here
                                </p>
                            </div>
                        ) : (
                            notifications.slice(0, 30).map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer
                                        ${!notif.read ? 'bg-amber-50 border-l-2 border-l-brand-accent' : ''}`}
                                    onClick={() => {
                                        // Optional: mark as read when clicked
                                        // markAsRead(notif.id)
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">{getNotificationIcon(notif.type)}</span>
                                        <div className="flex-1">
                                            <p className={`text-sm ${!notif.read ? 'font-semibold text-brand-black' : 'text-brand-gray'}`}>
                                                {getNotificationText(notif)}
                                            </p>
                                            <p className="text-xs text-brand-gray mt-0.5">
                                                {formatTimestamp(notif.created_at || notif.timestamp)}
                                            </p>
                                            {notif.order?.total_amount && (
                                                <p className="text-xs font-semibold text-brand-black mt-1">
                                                    ${notif.order.total_amount}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer with clear all option */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100">
                            <button
                                onClick={clearNotifications}
                                className="w-full text-center text-xs text-brand-gray hover:text-brand-danger py-1 transition-colors"
                            >
                                Clear all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default NotificationBell