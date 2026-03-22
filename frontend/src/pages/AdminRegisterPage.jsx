// pages/AdminRegisterPage.jsx
// SECRET PAGE — not linked anywhere in the UI
// Access it directly by visiting: http://localhost:5173/admin-setup
// Use this ONCE to create your platform admin account

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react'

// This secret key must match what the backend checks
// Change this to something only you know
const SECRET_KEY = 'foodcourt-admin-2024'

const AdminRegisterPage = () => {
    const navigate = useNavigate()
    const [secretInput, setSecretInput] = useState('')
    const [secretVerified, setSecretVerified] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        phone: '',
        password: '',
        password_confirm: '',
        // Force role to platform_admin — not editable by user
        role: 'platform_admin',
    })

    // Step 1 — verify the secret key before showing the form
    const handleSecretSubmit = (e) => {
        e.preventDefault()
        if (secretInput === SECRET_KEY) {
            setSecretVerified(true)
            toast.success('Access granted')
        } else {
            toast.error('Wrong secret key')
            setSecretInput('')
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.password_confirm) {
            toast.error('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await api.post('/auth/admin-setup/', formData)
            toast.success('Platform admin account created! Please log in.')
            navigate('/login')
        } catch (err) {
            const errors = err.response?.data
            if (errors) {
                Object.values(errors).flat().forEach((msg) => toast.error(String(msg)))
            } else {
                toast.error('Registration failed')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Admin Setup</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {secretVerified
                            ? 'Create the platform admin account'
                            : 'Enter the secret key to continue'}
                    </p>
                </div>

                {/* STEP 1 — Secret key gate */}
                {!secretVerified ? (
                    <div className="bg-brand-black-light border border-gray-800 rounded-2xl p-8">
                        <form onSubmit={handleSecretSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                                    Secret Key
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="password"
                                        value={secretInput}
                                        onChange={(e) => setSecretInput(e.target.value)}
                                        placeholder="Enter secret key..."
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-black border border-gray-700
                               text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent
                               focus:ring-1 focus:ring-brand-accent transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-3 
                                               rounded-xl hover:bg-amber-600 transition-colors">
                                Verify
                            </button>
                        </form>

                        {/* Hint — remove this in production */}
                        <p className="text-center text-xs text-gray-700 mt-4">
                            Hint: check AdminRegisterPage.jsx → SECRET_KEY
                        </p>
                    </div>

                ) : (
                    /* STEP 2 — Registration form */
                    <div className="bg-brand-black-light border border-gray-800 rounded-2xl p-8">

                        {/* Admin badge */}
                        <div className="flex items-center justify-center gap-2 mb-6 bg-brand-accent/10 
                            border border-brand-accent/30 rounded-xl py-2.5">
                            <ShieldCheck size={16} className="text-brand-accent" />
                            <span className="text-brand-accent text-sm font-bold">Platform Admin Account</span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Name row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="John"
                                        className="w-full px-4 py-2.5 rounded-xl bg-brand-black border border-gray-700
                               text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent
                               focus:ring-1 focus:ring-brand-accent transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Doe"
                                        className="w-full px-4 py-2.5 rounded-xl bg-brand-black border border-gray-700
                               text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent
                               focus:ring-1 focus:ring-brand-accent transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="admin_username"
                                    className="w-full px-4 py-3 rounded-xl bg-brand-black border border-gray-700
                             text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent
                             focus:ring-1 focus:ring-brand-accent transition-all"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="admin@foodcourt.com"
                                    className="w-full px-4 py-3 rounded-xl bg-brand-black border border-gray-700
                             text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent
                             focus:ring-1 focus:ring-brand-accent transition-all"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+254 700 000 000"
                                    className="w-full px-4 py-3 rounded-xl bg-brand-black border border-gray-700
                             text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent
                             focus:ring-1 focus:ring-brand-accent transition-all"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Min. 6 characters"
                                        className="w-full px-4 py-3 pr-12 rounded-xl bg-brand-black border border-gray-700
                               text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent
                               focus:ring-1 focus:ring-brand-accent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="password_confirm"
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                    required
                                    placeholder="Repeat your password"
                                    className="w-full px-4 py-3 rounded-xl bg-brand-black border border-gray-700
                             text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent
                             focus:ring-1 focus:ring-brand-accent transition-all"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-accent text-white font-bold py-3 rounded-xl
                           hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 mt-2">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><ShieldCheck size={18} /> Create Admin Account</>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Footer note */}
                <p className="text-center text-xs text-gray-700 mt-6">
                    This page is not linked anywhere. Keep the URL private.
                </p>
            </div>
        </div>
    )
}

export default AdminRegisterPage