// pages/dashboard/RegisterRestaurant.jsx
// Admin registers a manager account + their restaurant in one flow
// Produces a printable receipt at the end with login credentials

import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import {
    Store, ArrowLeft, Upload, User, CheckCircle,
    Printer, Eye, EyeOff, ChevronRight
} from 'lucide-react'

const RegisterRestaurant = () => {
    const navigate = useNavigate()
    const receiptRef = useRef(null)

    // Step 1 = manager details, Step 2 = restaurant details, Step 3 = receipt
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Holds the created manager after step 1
    const [createdManager, setCreatedManager] = useState(null)

    // Holds the created restaurant after step 2
    const [createdRestaurant, setCreatedRestaurant] = useState(null)

    // Image previews
    const [coverPreview, setCoverPreview] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)

    // Manager form state
    const [managerForm, setManagerForm] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        password_confirm: '',
    })

    // Restaurant form state
    const [restaurantForm, setRestaurantForm] = useState({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        cuisine_type: '',
        opening_hours: '9AM - 10PM',
        cover_image: null,
        logo: null,
    })

    // ── Handlers ──

    const handleManagerChange = (e) => {
        setManagerForm({ ...managerForm, [e.target.name]: e.target.value })
    }

    const handleRestaurantChange = (e) => {
        setRestaurantForm({ ...restaurantForm, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e, field) => {
        const file = e.target.files[0]
        if (!file) return
        setRestaurantForm({ ...restaurantForm, [field]: file })
        const reader = new FileReader()
        reader.onload = (ev) => {
            if (field === 'cover_image') setCoverPreview(ev.target.result)
            else setLogoPreview(ev.target.result)
        }
        reader.readAsDataURL(file)
    }

    // ── Step 1 — Create manager account ──
    const handleManagerSubmit = async (e) => {
        e.preventDefault()

        if (managerForm.password !== managerForm.password_confirm) {
            toast.error('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            const res = await api.post('/auth/register-manager/', {
                ...managerForm,
                role: 'restaurant_manager',
            })

            // Save manager data including plain password for the receipt
            setCreatedManager({
                ...res.data.user,
                plain_password: res.data.plain_password,
            })

            toast.success('Manager account created!')
            setStep(2)
        } catch (err) {
            const errors = err.response?.data
            if (errors) {
                Object.values(errors).flat().forEach((m) => toast.error(String(m)))
            } else {
                toast.error('Failed to create manager account')
            }
        } finally {
            setLoading(false)
        }
    }

    // ── Step 2 — Register restaurant for this manager ──
    const handleRestaurantSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const data = new FormData()
            // Attach the manager we just created
            data.append('manager_id', createdManager.id)
            Object.entries(restaurantForm).forEach(([key, val]) => {
                if (val !== null && val !== '') data.append(key, val)
            })

            const res = await api.post('/restaurants/', data)
            setCreatedRestaurant(res.data)
            toast.success('Restaurant registered!')
            setStep(3)
        } catch (err) {
            const errors = err.response?.data
            if (errors) {
                Object.values(errors).flat().forEach((m) => toast.error(String(m)))
            } else {
                toast.error('Failed to register restaurant')
            }
        } finally {
            setLoading(false)
        }
    }

    // ── Print receipt ──
    const handlePrint = () => {
        window.print()
    }

    // ── Step indicators at top ──
    const steps = [
        { number: 1, label: 'Manager Account' },
        { number: 2, label: 'Restaurant Info' },
        { number: 3, label: 'Receipt' },
    ]

    return (
        <div className="min-h-screen bg-brand-white-soft">
            {/* Hide navbar during print */}
            <div className="print:hidden">
                <Navbar />
            </div>

            <div className="container-main py-8 max-w-2xl">

                {/* Back button */}
                <button
                    onClick={() => navigate('/admin')}
                    className="print:hidden flex items-center gap-1.5 text-sm text-brand-gray
                     hover:text-brand-black mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Admin
                </button>

                {/* Step indicators */}
                <div className="print:hidden flex items-center justify-center gap-2 mb-8">
                    {steps.map((s, idx) => (
                        <React.Fragment key={s.number}>
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all
                  ${step === s.number
                                        ? 'bg-brand-black text-white'
                                        : step > s.number
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-400'}`}>
                                    {step > s.number ? <CheckCircle size={16} /> : s.number}
                                </div>
                                <span className={`text-sm font-medium hidden sm:block
                  ${step === s.number ? 'text-brand-black' : 'text-gray-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {idx < steps.length - 1 && (
                                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* ── STEP 1 — Manager account form ── */}
                {step === 1 && (
                    <div className="card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center">
                                <User size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-brand-black">Manager Account</h1>
                                <p className="text-sm text-brand-gray">
                                    Create login credentials for the restaurant manager
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleManagerSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        First Name *
                                    </label>
                                    <input
                                        type="text" name="first_name" value={managerForm.first_name}
                                        onChange={handleManagerChange} required placeholder="Jane"
                                        className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text" name="last_name" value={managerForm.last_name}
                                        onChange={handleManagerChange} required placeholder="Doe"
                                        className="input-field" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Username * <span className="text-brand-gray font-normal">(used to log in)</span>
                                </label>
                                <input
                                    type="text" name="username" value={managerForm.username}
                                    onChange={handleManagerChange} required placeholder="jane_manager"
                                    className="input-field" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Email Address *
                                </label>
                                <input
                                    type="email" name="email" value={managerForm.email}
                                    onChange={handleManagerChange} required placeholder="jane@restaurant.com"
                                    className="input-field" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Phone
                                </label>
                                <input
                                    type="tel" name="phone" value={managerForm.phone}
                                    onChange={handleManagerChange} placeholder="+254 700 000 000"
                                    className="input-field" />
                            </div>

                            {/* Password — admin sets this and shares it with manager */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Temporary Password *
                                    <span className="text-brand-gray font-normal ml-1">
                                        (will appear on receipt)
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password" value={managerForm.password}
                                        onChange={handleManagerChange} required
                                        placeholder="Set a temporary password"
                                        className="input-field pr-12" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password" name="password_confirm" value={managerForm.password_confirm}
                                    onChange={handleManagerChange} required
                                    placeholder="Repeat the password"
                                    className="input-field" />
                            </div>

                            <button type="submit" disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Next — Restaurant Info <ChevronRight size={18} /></>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── STEP 2 — Restaurant details form ── */}
                {step === 2 && (
                    <div className="card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center">
                                <Store size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-brand-black">Restaurant Details</h1>
                                <p className="text-sm text-brand-gray">
                                    For manager:{' '}
                                    <span className="font-semibold text-brand-black">
                                        {createdManager?.first_name} {createdManager?.last_name}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleRestaurantSubmit} className="space-y-4">

                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Restaurant Name *
                                </label>
                                <input
                                    type="text" name="name" value={restaurantForm.name}
                                    onChange={handleRestaurantChange} required
                                    placeholder="e.g. The Nairobi Grill"
                                    className="input-field" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    name="description" value={restaurantForm.description}
                                    onChange={handleRestaurantChange} rows={3}
                                    placeholder="Brief description of the restaurant..."
                                    className="input-field resize-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Address *
                                    </label>
                                    <input
                                        type="text" name="address" value={restaurantForm.address}
                                        onChange={handleRestaurantChange} required
                                        placeholder="123 Kenyatta Ave, Nairobi"
                                        className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel" name="phone" value={restaurantForm.phone}
                                        onChange={handleRestaurantChange} required
                                        placeholder="+254 700 000 000"
                                        className="input-field" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Restaurant Email
                                    </label>
                                    <input
                                        type="email" name="email" value={restaurantForm.email}
                                        onChange={handleRestaurantChange}
                                        placeholder="restaurant@email.com"
                                        className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Cuisine Type
                                    </label>
                                    <input
                                        type="text" name="cuisine_type" value={restaurantForm.cuisine_type}
                                        onChange={handleRestaurantChange}
                                        placeholder="e.g. Kenyan, Italian"
                                        className="input-field" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Opening Hours
                                </label>
                                <input
                                    type="text" name="opening_hours" value={restaurantForm.opening_hours}
                                    onChange={handleRestaurantChange}
                                    placeholder="e.g. 9AM - 10PM"
                                    className="input-field" />
                            </div>

                            {/* Cover image upload */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Cover Image
                                </label>
                                <div className={`border-2 border-dashed border-gray-200 rounded-xl overflow-hidden
                                hover:border-gray-400 transition-colors
                                ${coverPreview ? '' : 'p-6'}`}>
                                    {coverPreview ? (
                                        <div className="relative">
                                            <img src={coverPreview} alt="Cover"
                                                className="w-full h-40 object-cover" />
                                            <label className="absolute inset-0 flex items-center justify-center
                                       bg-black/40 cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                                <span className="text-white text-sm font-semibold">Change</span>
                                                <input type="file" accept="image/*" className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'cover_image')} />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center gap-2 cursor-pointer">
                                            <Upload size={24} className="text-gray-400" />
                                            <span className="text-sm text-brand-gray">Click to upload cover photo</span>
                                            <input type="file" accept="image/*" className="hidden"
                                                onChange={(e) => handleFileChange(e, 'cover_image')} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Logo upload */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Logo
                                </label>
                                <div className="flex items-center gap-4">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo"
                                            className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                                            <Store size={24} className="text-gray-300" />
                                        </div>
                                    )}
                                    <label className="btn-secondary text-sm cursor-pointer">
                                        Upload Logo
                                        <input type="file" accept="image/*" className="hidden"
                                            onChange={(e) => handleFileChange(e, 'logo')} />
                                    </label>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><Store size={18} /> Register Restaurant</>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── STEP 3 — Printable receipt ── */}
                {step === 3 && createdManager && createdRestaurant && (
                    <div>
                        {/* Print button — hidden when actually printing */}
                        <div className="print:hidden flex justify-end mb-4">
                            <button
                                onClick={handlePrint}
                                className="btn-primary flex items-center gap-2">
                                <Printer size={18} />
                                Print Receipt
                            </button>
                        </div>

                        {/* ── THE RECEIPT ── */}
                        <div
                            ref={receiptRef}
                            className="bg-white rounded-2xl shadow-shiny-lg overflow-hidden
                         print:shadow-none print:rounded-none">

                            {/* Receipt header */}
                            <div className="bg-brand-black text-white p-8 text-center print:p-6">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-2xl">🍽</span>
                                    <span className="text-2xl font-black">
                                        Food<span className="text-brand-accent">Court</span>
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm">Restaurant Registration Certificate</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    Issued on {new Date().toLocaleDateString('en-KE', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </p>
                            </div>

                            {/* Receipt body */}
                            <div className="p-8 space-y-6 print:p-6">

                                {/* Welcome message */}
                                <div className="text-center py-4 border-b border-dashed border-gray-200">
                                    <CheckCircle size={40} className="text-green-500 mx-auto mb-2" />
                                    <h2 className="text-xl font-black text-brand-black">
                                        Welcome to FoodCourt!
                                    </h2>
                                    <p className="text-brand-gray text-sm mt-1">
                                        Your restaurant has been successfully registered on our platform.
                                    </p>
                                </div>

                                {/* Restaurant info section */}
                                <div>
                                    <h3 className="text-xs font-bold text-brand-gray uppercase tracking-widest mb-3">
                                        Restaurant Details
                                    </h3>
                                    <div className="bg-brand-white-soft rounded-xl p-4 space-y-2">
                                        <Row label="Restaurant Name" value={createdRestaurant.name} />
                                        <Row label="Cuisine" value={createdRestaurant.cuisine_type || '—'} />
                                        <Row label="Address" value={createdRestaurant.address} />
                                        <Row label="Phone" value={createdRestaurant.phone} />
                                        <Row label="Opening Hours" value={createdRestaurant.opening_hours} />
                                        <Row label="Status" value="Active ✓" highlight />
                                    </div>
                                </div>

                                {/* Manager info section */}
                                <div>
                                    <h3 className="text-xs font-bold text-brand-gray uppercase tracking-widest mb-3">
                                        Manager Details
                                    </h3>
                                    <div className="bg-brand-white-soft rounded-xl p-4 space-y-2">
                                        <Row
                                            label="Full Name"
                                            value={`${createdManager.first_name} ${createdManager.last_name}`}
                                        />
                                        <Row label="Email" value={createdManager.email} />
                                        <Row label="Phone" value={createdManager.phone || '—'} />
                                    </div>
                                </div>

                                {/* Login credentials — most important section */}
                                <div>
                                    <h3 className="text-xs font-bold text-brand-gray uppercase tracking-widest mb-3">
                                        Login Credentials
                                    </h3>
                                    <div className="bg-brand-black rounded-xl p-5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">Platform URL</span>
                                            <span className="text-white font-mono text-sm font-bold">
                                                {window.location.origin}
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-700" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">Username</span>
                                            <span className="text-brand-accent font-mono text-sm font-bold">
                                                {createdManager.username}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">Password</span>
                                            <span className="text-brand-accent font-mono text-sm font-bold">
                                                {createdManager.plain_password}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-brand-gray mt-2 text-center">
                                        ⚠️ Please change your password after first login.
                                    </p>
                                </div>

                                {/* What's next */}
                                <div className="border-t border-dashed border-gray-200 pt-4">
                                    <h3 className="text-xs font-bold text-brand-gray uppercase tracking-widest mb-3">
                                        What's Next
                                    </h3>
                                    <div className="space-y-2">
                                        {[
                                            'Log in at the platform URL above using your credentials',
                                            'Go to your Dashboard to set up your menu',
                                            'Add your menu items with photos and prices',
                                            'Start receiving orders in real time',
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-start gap-2.5 text-sm text-brand-gray">
                                                <span className="w-5 h-5 rounded-full bg-brand-black text-white text-xs
                                         font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                {step}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer of receipt */}
                                <div className="border-t border-dashed border-gray-200 pt-4 text-center">
                                    <p className="text-xs text-gray-400">
                                        This document was generated by FoodCourt Platform Admin
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Keep this document safe — it contains your login credentials
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Done button */}
                        <div className="print:hidden mt-6 flex justify-center">
                            <button onClick={() => navigate('/admin')} className="btn-secondary">
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Small helper component for receipt rows
const Row = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-brand-gray">{label}</span>
        <span className={`font-semibold ${highlight ? 'text-green-600' : 'text-brand-black'}`}>
            {value}
        </span>
    </div>
)

export default RegisterRestaurant