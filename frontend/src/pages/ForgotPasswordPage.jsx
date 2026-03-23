// pages/ForgotPasswordPage.jsx
// User enters their email, we send a reset link

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Send } from 'lucide-react'

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post('/auth/forgot-password/', { email })
            setSent(true)
        } catch (err) {
            toast.error('Something went wrong. Please try again.')
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
                            Food<span className="text-brand-accent">Court</span>
                        </span>
                    </Link>
                </div>

                <div className="card p-8">
                    {!sent ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-brand-black rounded-2xl flex items-center
                                justify-center mx-auto mb-4">
                                    <Mail size={24} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-black text-brand-black">Forgot Password?</h1>
                                <p className="text-brand-gray mt-1 text-sm">
                                    Enter your email and we'll send you a reset link
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="the email used during registration"
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
                                        <><Send size={16} /> Send Reset Link</>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        // Success state
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                              justify-center mx-auto mb-4">
                                <Mail size={28} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-black text-brand-black">Check your email</h2>
                            <p className="text-brand-gray mt-2 text-sm">
                                If <span className="font-semibold text-brand-black">{email}</span> is
                                registered, a password reset link has been sent.
                            </p>
                            <p className="text-brand-gray mt-1 text-xs">
                                Check your spam folder if you don't see it.
                            </p>
                            {/* Dev hint */}
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
                                <p className="text-xs text-amber-800 font-semibold">Development mode</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    The reset link is printed in your Django terminal instead of
                                    being sent by email. Check the terminal running daphne.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-1.5 text-sm
                         text-brand-gray hover:text-brand-black transition-colors">
                            <ArrowLeft size={14} /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordPage