// App.jsx — Route definitions and layout wrapper
import usePushNotifications from './hooks/usePushNotifications'
import { useAuth } from './context/AuthContext'
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

// Pages
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProfilePage from './pages/ProfilePage'
import RestaurantSettings from './pages/dashboard/RestaurantSettings'
import AdminRegisterPage from './pages/AdminRegisterPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RestaurantDetailPage from './pages/RestaurantDetailPage'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'

// Dashboard pages
import AdminDashboard from './pages/dashboard/AdminDashboard'
import RestaurantDashboard from './pages/dashboard/RestaurantDashboard'
import ManageMenu from './pages/dashboard/ManageMenu'
import ManageOrders from './pages/dashboard/ManageOrders'
import RegisterRestaurant from './pages/dashboard/RegisterRestaurant'

// Route guards
import ProtectedRoute from './components/ProtectedRoute'
// Inner component so we can use useAuth inside AuthProvider
const PushNotificationSetup = () => {
  const { user } = useAuth()
  usePushNotifications(user)
  return null
}
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <PushNotificationSetup />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin-setup" element={<AdminRegisterPage />} />
          <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />

          {/* Password reset — public */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Profile — any logged in user */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Restaurant settings — manager only */}
          <Route path="/dashboard/settings" element={
            <ProtectedRoute requiredRole="restaurant_manager">
              <RestaurantSettings />
            </ProtectedRoute>
          } />

          {/* Protected — any logged in user */}
          <Route path="/cart" element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />

          {/* Platform Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="platform_admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/register-restaurant" element={
            <ProtectedRoute requiredRole="platform_admin">
              <RegisterRestaurant />
            </ProtectedRoute>
          } />

          {/* Restaurant Manager routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="restaurant_manager">
              <RestaurantDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/menu" element={
            <ProtectedRoute requiredRole="restaurant_manager">
              <ManageMenu />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/orders" element={
            <ProtectedRoute requiredRole="restaurant_manager">
              <ManageOrders />
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  )
}