// pages/LoginPage.jsx — Login with username and password

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, User } from 'lucide-react'

const LoginPage = () => {
    const { login } = useAuth()
    const navigate = useNavigate()

    // Changed from email to username
    const [formData, setFormData] = useState({ username: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const user = await login(formData.username, formData.password)
            toast.success(`Welcome back, ${user.first_name || user.username}!`)

            // Redirect based on role
            if (user.role === 'platform_admin') navigate('/admin')
            else if (user.role === 'restaurant_manager') navigate('/dashboard')
            else navigate('/')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid username or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-brand-white-soft flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center">
                            <span className="text-white">🍽</span>
                        </div>
                        <span className="text-2xl font-black text-brand-black">
                            MOI<span className="text-brand-accent">EATS</span>
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold text-brand-black mt-4">Welcome back</h1>
                    <p className="text-brand-gray mt-1">Sign in with your username</p>
                </div>

                {/* Card */}
                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Username field */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="your_username"
                                    autoComplete="username"
                                    className="input-field pl-10"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    className="input-field pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><LogIn size={18} /> Sign In</>
                            )}
                        </button>
                        <div className="text-center">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-brand-gray hover:text-brand-black transition-colors">
                                Forgot your password?
                            </Link>
                        </div>
                    </form>

                    <p className="text-center text-sm text-brand-gray mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-brand-black font-semibold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage