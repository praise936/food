// pages/OrdersPage.jsx — Customer's order history
import React, { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { useCart, formatCurrency, formatDate, getStatusColor } from '../utils/helpers'
import { Package, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const OrdersPage = () => {
    const { cartCount } = useCart()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const pollingInterval = useRef(null)

    const statusSteps = ['pending', 'confirmed', 'preparing', 'ready', 'completed']

    // Fetch orders function
    const fetchOrders = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true)

        try {
            const res = await api.get('/orders/my/')
            setOrders(res.data)
        } catch (err) {
            console.error('Failed to fetch orders:', err)
            // Optional: Show error toast/notification
        } finally {
            setLoading(false)
            if (showRefreshing) setRefreshing(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        fetchOrders()

        // Set up polling for order updates (instead of WebSockets)
        // Poll every 30 seconds to check for status updates
        pollingInterval.current = setInterval(() => {
            // Only poll if the page is visible and not already refreshing
            if (document.visibilityState === 'visible' && !refreshing) {
                fetchOrders()
            }
        }, 30000) // 30 seconds

        // Clean up polling on unmount
        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current)
            }
        }
    }, [fetchOrders, refreshing])

    // Optional: Refresh orders when page becomes visible again
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Refresh when user returns to the tab
                fetchOrders()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [fetchOrders])

    // Manual refresh handler
    const handleManualRefresh = () => {
        fetchOrders(true)
    }

    // Optional: Polling with exponential backoff (more advanced)
    // This can be used instead of the simple interval above
    const setupPollingWithBackoff = useCallback(() => {
        let delay = 5000 // Start with 5 seconds
        const maxDelay = 60000 // Max 60 seconds

        const poll = async () => {
            try {
                await fetchOrders()
                delay = 5000 // Reset delay on success
            } catch (error) {
                console.error('Polling error:', error)
                delay = Math.min(delay * 2, maxDelay) // Exponential backoff
            }

            // Schedule next poll
            pollingInterval.current = setTimeout(poll, delay)
        }

        poll()

        return () => {
            if (pollingInterval.current) {
                clearTimeout(pollingInterval.current)
            }
        }
    }, [fetchOrders])

    return (
        <div className="min-h-screen bg-brand-white-soft">
            <Navbar cartCount={cartCount} />

            <div className="container-main py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black text-brand-black flex items-center gap-2">
                        <Package size={24} />
                        My Orders
                    </h1>

                    {/* Manual refresh button */}
                    <button
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-brand-gray hover:text-brand-black transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-24">
                        {/* empty-plate illustration */}
                        <img
                            src="/src/assets/empty-plate.png"
                            alt="No orders yet"
                            className="w-36 h-36 object-contain mx-auto mb-4 opacity-60"
                            onError={(e) => {
                                e.target.style.display = 'none' // Hide if image fails to load
                            }}
                        />
                        <h2 className="text-xl font-bold text-brand-black">No orders yet</h2>
                        <p className="text-brand-gray mt-1">Order some food and it'll show up here</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-3xl">
                        {orders.map((order) => (
                            <div key={order.id} className="card overflow-hidden">
                                {/* Order header */}
                                <button
                                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center">
                                            <Package size={18} className="text-white" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-brand-black">
                                                Order #{order.id} — {order.restaurant_name}
                                            </p>
                                            <p className="text-sm text-brand-gray">{formatDate(order.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={getStatusColor(order.status)}>
                                            {order.status_display}
                                        </span>
                                        <span className="font-bold text-brand-black">
                                            {formatCurrency(order.total_amount)}
                                        </span>
                                        {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </button>

                                {/* Expanded details */}
                                {expandedOrder === order.id && (
                                    <div className="border-t border-gray-100 p-5 space-y-4">
                                        {/* Status progress bar */}
                                        {order.status !== 'cancelled' && (
                                            <div>
                                                <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-2">
                                                    Order Progress
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    {statusSteps.map((step, idx) => {
                                                        const currentIdx = statusSteps.indexOf(order.status)
                                                        const isCompleted = idx <= currentIdx
                                                        return (
                                                            <div
                                                                key={step}
                                                                className={`flex-1 h-2 rounded-full transition-all ${isCompleted ? 'bg-brand-black' : 'bg-gray-200'
                                                                    }`}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                                <div className="flex justify-between mt-1">
                                                    {statusSteps.map((step) => (
                                                        <span
                                                            key={step}
                                                            className={`text-xs capitalize ${order.status === step
                                                                    ? 'text-brand-black font-bold'
                                                                    : 'text-gray-300'
                                                                }`}
                                                        >
                                                            {step}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div>
                                            <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-2">
                                                Items
                                            </p>
                                            <div className="space-y-2">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-3">
                                                            {item.menu_item_image_url && (
                                                                <img
                                                                    src={item.menu_item_image_url}
                                                                    alt={item.menu_item_name}
                                                                    className="w-8 h-8 rounded-lg object-cover"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none'
                                                                    }}
                                                                />
                                                            )}
                                                            <span className="text-brand-black">
                                                                {item.menu_item_name} × {item.quantity}
                                                            </span>
                                                        </div>
                                                        <span className="font-semibold text-brand-black">
                                                            {formatCurrency(item.subtotal)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {order.notes && (
                                            <div>
                                                <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-1">
                                                    Notes
                                                </p>
                                                <p className="text-sm text-brand-gray">{order.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default OrdersPage