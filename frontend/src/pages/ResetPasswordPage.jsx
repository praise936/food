// pages/ResetPasswordPage.jsx
// User lands here from the email link, sets a new password

import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'

const ResetPasswordPage = () => {
    // Token comes from the URL — /reset-password/:token
    const { token } = useParams()
    const navigate = useNavigate()

    const [form, setForm] = useState({ new_password: '', confirm_password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.new_password !== form.confirm_password) {
            toast.error('Passwords do not match')
            return
        }
        setLoading(true)
        try {
            await api.post('/auth/reset-password/', { token, ...form })
            setDone(true)
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            toast.error(err.response?.data?.error || 'Reset failed. Link may have expired.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-brand-white-soft flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center">
                            <span className="text-white">🍽</span>
                        </div>
                        <span className="text-2xl font-black text-brand-black">
                            Food<span className="text-brand-accent">Court</span>
                        </span>
                    </Link>
                </div>

                <div className="card p-8">
                    {!done ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-brand-black rounded-2xl flex items-center
                                justify-center mx-auto mb-4">
                                    <Lock size={24} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-black text-brand-black">Set New Password</h1>
                                <p className="text-brand-gray mt-1 text-sm">
                                    Choose a strong password for your account
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="new_password"
                                            value={form.new_password}
                                            onChange={handleChange}
                                            required
                                            placeholder="Min. 6 characters"
                                            className="input-field pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-gray-400 hover:text-brand-black">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        value={form.confirm_password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Repeat new password"
                                        className="input-field"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <><Lock size={16} /> Reset Password</>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        // Success state
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                              justify-center mx-auto mb-4">
                                <CheckCircle size={28} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-black text-brand-black">Password Reset!</h2>
                            <p className="text-brand-gray mt-2 text-sm">
                                Your password has been changed successfully.
                                Redirecting you to login...
                            </p>
                            <div className="mt-4 w-8 h-8 border-2 border-gray-200 border-t-brand-black
                              rounded-full animate-spin mx-auto" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ResetPasswordPage