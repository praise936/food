// pages/dashboard/RestaurantDashboard.jsx — Manager's home dashboard
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { ShoppingBag, Utensils, Star, TrendingUp, Bell, RefreshCw, Settings } from 'lucide-react'

const RestaurantDashboard = () => {
    const { user } = useAuth()
    const { unreadCount } = useNotifications() // Get notification count
    const [restaurant, setRestaurant] = useState(null)
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [newOrderAlert, setNewOrderAlert] = useState(null)
    const pollingInterval = useRef(null)
    // cover

    // Fetch all dashboard data
    const fetchData = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true)

        try {
            // Get restaurant info
            const restRes = await api.get('/restaurants/my-restaurant/')
            setRestaurant(restRes.data)

            // Get orders for this restaurant
            const ordersRes = await api.get(`/orders/restaurant/${restRes.data.id}/`)
            const fetchedOrders = ordersRes.data

            setOrders(fetchedOrders)

            // Check for new orders (within last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
            const newOrders = fetchedOrders.filter(order =>
                order.status === 'pending' &&
                new Date(order.created_at) > fiveMinutesAgo
            )

            // Show alert for newest pending order if exists
            if (newOrders.length > 0 && !newOrderAlert) {
                setNewOrderAlert(newOrders[0])

                // Auto-dismiss after 30 seconds
                setTimeout(() => {
                    setNewOrderAlert(null)
                }, 30000)
            }

        } catch (err) {
            console.error('Failed to fetch dashboard data:', err)
        } finally {
            setLoading(false)
            if (showRefreshing) setRefreshing(false)
        }
    }, [newOrderAlert])

    // Initial load
    useEffect(() => {
        fetchData()

        // Set up polling for new orders (instead of WebSockets)
        pollingInterval.current = setInterval(() => {
            if (document.visibilityState === 'visible' && !refreshing) {
                fetchData()
            }
        }, 30000) // Poll every 30 seconds

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current)
            }
        }
    }, [fetchData, refreshing])

    // Refresh when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !loading) {
                fetchData()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [fetchData, loading])

    // Manual refresh handler
    const handleManualRefresh = () => {
        fetchData(true)
    }

    // Dismiss new order alert
    const dismissAlert = () => {
        setNewOrderAlert(null)
    }

    const pendingOrders = orders.filter((o) => o.status === 'pending').length
    const todayOrders = orders.filter((o) => {
        const today = new Date().toDateString()
        return new Date(o.created_at).toDateString() === today
    }).length

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-white-soft">
                <Navbar />
                <div className="container-main py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-32 bg-gray-200 rounded-2xl" />
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-brand-white-soft">
            <Navbar />

            <div className="container-main py-8">

                {/* Refresh button and header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-brand-black">Dashboard</h2>
                    <button
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-gray hover:text-brand-black transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {/* New order alert - now based on polling */}
                {newOrderAlert && (
                    <div className="mb-6 p-4 bg-brand-accent/10 border-2 border-brand-accent rounded-2xl 
                          flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                            <Bell size={20} className="text-brand-accent" />
                            <div>
                                <p className="font-bold text-brand-black">New Order Received!</p>
                                <p className="text-sm text-brand-gray">
                                    Order #{newOrderAlert.id} from {newOrderAlert.customer_name || 'a customer'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link to="/dashboard/orders" className="btn-accent text-sm py-1.5 px-4">
                                View Orders
                            </Link>
                            <button
                                onClick={dismissAlert}
                                className="text-sm text-brand-gray hover:text-brand-black"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Restaurant header card */}
                {restaurant && (
                    <div className="card overflow-hidden mb-8">
                        <div className="relative h-32 bg-brand-black">
                            {restaurant.cover_image && (
                                <img
                                    src={restaurant.cover_image}
                                    alt={restaurant.name}
                                    className="w-full h-full object-cover opacity-50"
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                    }}
                                />
                            )}
                            <div className="absolute inset-0 flex items-center px-6 gap-4">
                                {restaurant.logo && (
                                    <img
                                        src={restaurant.logo}
                                        alt={restaurant.name}
                                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white"
                                        onError={(e) => {
                                            e.target.style.display = 'none'
                                        }}
                                    />
                                )}
                                <div>
                                    <h1 className="text-2xl font-black text-white">{restaurant.name}</h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full
                                            ${restaurant.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {restaurant.status}
                                        </span>
                                        <span className="text-gray-300 text-xs flex items-center gap-1">
                                            <Star size={12} className="fill-brand-accent text-brand-accent" />
                                            {restaurant.average_rating} ({restaurant.total_reviews} reviews)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        {
                            label: 'Total Orders',
                            value: orders.length,
                            icon: ShoppingBag,
                            color: 'bg-brand-black text-white'
                        },
                        {
                            label: 'Pending Orders',
                            value: pendingOrders,
                            icon: Bell,
                            color: pendingOrders > 0 ? 'bg-brand-accent text-white' : 'bg-gray-100 text-brand-black'
                        },
                        {
                            label: "Today's Orders",
                            value: todayOrders,
                            icon: TrendingUp,
                            color: 'bg-green-500 text-white'
                        },
                        {
                            label: 'Avg Rating',
                            value: `⭐ ${restaurant?.average_rating || '—'}`,
                            icon: Star,
                            color: 'bg-purple-500 text-white'
                        },
                    ].map((stat) => (
                        <div key={stat.label} className="card p-5">
                            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                                <stat.icon size={20} />
                            </div>
                            <p className="text-2xl font-black text-brand-black">{stat.value}</p>
                            <p className="text-sm text-brand-gray mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link to="/dashboard/menu"
                        className="card p-6 flex items-center gap-4 hover:shadow-shiny transition-all cursor-pointer group">
                        <div className="w-12 h-12 bg-brand-black rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Utensils size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-black">Manage Menu</h3>
                            <p className="text-sm text-brand-gray">Add, edit, or update your menu items</p>
                        </div>
                    </Link>

                    <Link to="/dashboard/orders"
                        className="card p-6 flex items-center gap-4 hover:shadow-shiny transition-all cursor-pointer group relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform relative
                            ${pendingOrders > 0 ? 'bg-brand-accent' : 'bg-brand-black'}`}>
                            <ShoppingBag size={22} className="text-white" />
                            {pendingOrders > 0 && (
                                <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                                    {pendingOrders}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-black">Manage Orders</h3>
                            <p className="text-sm text-brand-gray">
                                {pendingOrders > 0
                                    ? `${pendingOrders} pending order${pendingOrders > 1 ? 's' : ''}!`
                                    : 'View and update order status'}
                            </p>
                        </div>
                    </Link>
                    <Link to="/dashboard/settings"
                        className="card p-6 flex items-center gap-4 hover:shadow-shiny transition-all cursor-pointer group">
                        <div className="w-12 h-12 bg-brand-black rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Settings size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-black">Restaurant Settings</h3>
                            <p className="text-sm text-brand-gray">Update info, images and manager</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default RestaurantDashboard