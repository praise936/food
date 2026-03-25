// pages/ProfilePage.jsx
// Any logged in user can view and edit their profile
// and change their password from here

import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../utils/helpers'
import toast from 'react-hot-toast'
import {
    User, Camera, Lock, Eye, EyeOff,
    Save, ArrowLeft, Shield
} from 'lucide-react'

const ProfilePage = () => {
    const { user, updateUser } = useAuth()
    const { cartCount } = useCart()
    const navigate = useNavigate()
    const avatarInputRef = useRef(null)

    const [activeTab, setActiveTab] = useState('profile')
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)
    const [showPasswords, setShowPasswords] = useState({
        current: false, new: false, confirm: false,
    })

    const [profileForm, setProfileForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        avatar: null,
    })

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_new_password: '',
    })

    const handleProfileChange = (e) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value })
    }

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
    }

    const handleAvatarChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setProfileForm({ ...profileForm, avatar: file })
        const reader = new FileReader()
        reader.onload = (ev) => setAvatarPreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    const handleProfileSave = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            // First, upload avatar to Supabase if there's a new file
            let avatarUrl = null
            if (profileForm.avatar) {
                avatarUrl = await uploadImage(profileForm.avatar)
                if (!avatarUrl) {
                    toast.error('Failed to upload avatar')
                    setSavingProfile(false)
                    return
                }
            }

            // Then send the profile data with avatar URL
            const data = {
                first_name: profileForm.first_name,
                last_name: profileForm.last_name,
                phone: profileForm.phone,
            }

            if (avatarUrl) {
                data.avatar = avatarUrl  // Send URL, not the file
            }

            const res = await api.put('/auth/profile/', data)
            updateUser(res.data)
            toast.success('Profile updated successfully!')
        } catch (err) {
            toast.error('Failed to update profile')
        } finally {
            setSavingProfile(false)
        }
    }

    const handlePasswordSave = async (e) => {
        e.preventDefault()
        if (passwordForm.new_password !== passwordForm.confirm_new_password) {
            toast.error('New passwords do not match')
            return
        }
        setSavingPassword(true)
        try {
            const res = await api.post('/auth/change-password/', passwordForm)
            // Update tokens since password changed
            localStorage.setItem('access_token', res.data.access)
            localStorage.setItem('refresh_token', res.data.refresh)
            toast.success('Password changed successfully!')
            setPasswordForm({
                current_password: '', new_password: '', confirm_new_password: '',
            })
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to change password')
        } finally {
            setSavingPassword(false)
        }
    }

    const toggleShow = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
    }

    // Current avatar to show — preview takes priority, then server url, then initial
    const currentAvatar = avatarPreview || user?.avatar_url

    return (
        <div className="min-h-screen bg-brand-white-soft">
            <Navbar cartCount={cartCount} />

            <div className="container-main py-8 max-w-2xl">

                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-brand-gray
                     hover:text-brand-black mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back
                </button>

                <h1 className="text-2xl font-black text-brand-black mb-6">My Profile</h1>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-card mb-6 w-fit">
                    {[
                        { key: 'profile', icon: User, label: 'Profile Info' },
                        { key: 'password', icon: Lock, label: 'Change Password' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold
                          text-sm transition-all
                          ${activeTab === tab.key
                                    ? 'bg-brand-black text-white shadow-sm'
                                    : 'text-brand-gray hover:text-brand-black'}`}>
                            <tab.icon size={15} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── PROFILE TAB ── */}
                {activeTab === 'profile' && (
                    <div className="card p-8">
                        <form onSubmit={handleProfileSave} className="space-y-6">

                            {/* Avatar */}
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-black
                                  flex items-center justify-center flex-shrink-0">
                                        {currentAvatar ? (
                                            <img src={currentAvatar} alt="Avatar"
                                                className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-2xl font-black">
                                                {user?.first_name?.[0]?.toUpperCase() ||
                                                    user?.username?.[0]?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    {/* Camera overlay */}
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-accent
                               text-white rounded-xl flex items-center justify-center
                               shadow-md hover:bg-amber-600 transition-colors">
                                        <Camera size={14} />
                                    </button>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-brand-black">
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-sm text-brand-gray">@{user?.username}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Shield size={12} className="text-brand-accent" />
                                        <span className="text-xs text-brand-gray capitalize">
                                            {user?.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={profileForm.first_name}
                                        onChange={handleProfileChange}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={profileForm.last_name}
                                        onChange={handleProfileChange}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Read-only info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Username
                                        <span className="text-brand-gray font-normal ml-1">(cannot change)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.username}
                                        disabled
                                        className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Email
                                        <span className="text-brand-gray font-normal ml-1">(cannot change)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email}
                                        disabled
                                        className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileForm.phone}
                                    onChange={handleProfileChange}
                                    placeholder="+254 700 000 000"
                                    className="input-field"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="btn-primary flex items-center gap-2 py-3 px-8">
                                {savingProfile ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white
                                  rounded-full animate-spin" />
                                ) : (
                                    <><Save size={16} /> Save Changes</>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── CHANGE PASSWORD TAB ── */}
                {activeTab === 'password' && (
                    <div className="card p-8">
                        <form onSubmit={handlePasswordSave} className="space-y-4">

                            <div className="p-4 bg-brand-white-mid rounded-xl mb-2">
                                <p className="text-sm text-brand-gray">
                                    After changing your password you will stay logged in.
                                    Your other sessions will be invalidated.
                                </p>
                            </div>

                            {/* Current password */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        name="current_password"
                                        value={passwordForm.current_password}
                                        onChange={handlePasswordChange}
                                        required
                                        placeholder="Your current password"
                                        className="input-field pr-12"
                                    />
                                    <button type="button" onClick={() => toggleShow('current')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2
                               text-gray-400 hover:text-brand-black">
                                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* New password */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        name="new_password"
                                        value={passwordForm.new_password}
                                        onChange={handlePasswordChange}
                                        required
                                        placeholder="Min. 6 characters"
                                        className="input-field pr-12"
                                    />
                                    <button type="button" onClick={() => toggleShow('new')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2
                               text-gray-400 hover:text-brand-black">
                                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm new password */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        name="confirm_new_password"
                                        value={passwordForm.confirm_new_password}
                                        onChange={handlePasswordChange}
                                        required
                                        placeholder="Repeat new password"
                                        className="input-field pr-12"
                                    />
                                    <button type="button" onClick={() => toggleShow('confirm')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2
                               text-gray-400 hover:text-brand-black">
                                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="btn-primary flex items-center gap-2 py-3 px-8">
                                {savingPassword ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white
                                  rounded-full animate-spin" />
                                ) : (
                                    <><Lock size={16} /> Change Password</>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProfilePage