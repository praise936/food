// pages/dashboard/RegisterRestaurant.jsx
// Admin registers a restaurant — can either create a NEW manager
// or pick an EXISTING manager who doesn't have a restaurant yet

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { uploadImage } from '../../api/uploadImage'
import {
    Store, ArrowLeft, Upload, User, CheckCircle,
    Printer, Eye, EyeOff, ChevronRight, Users,
    UserPlus, Search
} from 'lucide-react'

const RegisterRestaurant = () => {
    const navigate = useNavigate()
    const receiptRef = useRef(null)

    // 'new' = create a brand new manager account
    // 'existing' = pick from managers who don't have a restaurant yet
    const [managerMode, setManagerMode] = useState('new')

    // Step 1 = manager setup, Step 2 = restaurant details, Step 3 = receipt
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // List of existing managers without a restaurant
    const [availableManagers, setAvailableManagers] = useState([])
    const [managersLoading, setManagersLoading] = useState(false)
    const [managerSearch, setManagerSearch] = useState('')

    // The manager that will be linked to the restaurant
    // Either freshly created or picked from existing list
    const [createdManager, setCreatedManager] = useState(null)

    // Tracks which existing manager card is selected
    const [selectedExistingManager, setSelectedExistingManager] = useState(null)

    const [createdRestaurant, setCreatedRestaurant] = useState(null)

    // Image previews
    const [coverPreview, setCoverPreview] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)

    // New manager form
    const [managerForm, setManagerForm] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        password_confirm: '',
    })

    // Restaurant form
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

    // Load existing managers when tab switches to 'existing'
    useEffect(() => {
        if (managerMode === 'existing') {
            fetchAvailableManagers()
        }
    }, [managerMode])

    const fetchAvailableManagers = async () => {
        setManagersLoading(true)
        try {
            const res = await api.get('/auth/users/')
            // Only show restaurant_manager role users
            // Filter out those who already have a restaurant (manager_info present means taken)
            const managers = res.data.filter((u) => u.role === 'restaurant_manager')

            // Now check which ones already have a restaurant by fetching restaurants
            const restRes = await api.get('/restaurants/')
            const takenManagerIds = restRes.data.map((r) => r.manager_info?.id)

            // Keep only managers who are NOT already linked to a restaurant
            const free = managers.filter((m) => !takenManagerIds.includes(m.id))
            setAvailableManagers(free)
        } catch (err) {
            toast.error('Failed to load managers')
        } finally {
            setManagersLoading(false)
        }
    }

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

    // ── Step 1a — Create new manager ──
    const handleNewManagerSubmit = async (e) => {
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
            setCreatedManager({
                ...res.data.user,
                plain_password: res.data.plain_password,
                isNew: true, // flag so receipt shows the password
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

    // ── Step 1b — Confirm existing manager selection ──
    const handleExistingManagerConfirm = () => {
        if (!selectedExistingManager) {
            toast.error('Please select a manager first')
            return
        }
        // Use existing manager — no password on receipt since they already know it
        setCreatedManager({
            ...selectedExistingManager,
            plain_password: null,
            isNew: false,
        })
        toast.success(`${selectedExistingManager.first_name} selected as manager`)
        setStep(2)
    }

    // ── Step 2 — Register restaurant ──
    const handleRestaurantSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            let coverImageUrl = null
            let logoUrl = null
            if (restaurantForm.cover_image?.size > 2 * 1024 * 1024) {
                toast.error("Cover image must be less than 2MB")
                return
            }

            if (restaurantForm.logo?.size > 2 * 1024 * 1024) {
                toast.error("Logo must be less than 2MB")
                return
            }
            // upload cover image
            if (restaurantForm.cover_image) {
                coverImageUrl = await uploadImage(restaurantForm.cover_image)
                if (!coverImageUrl) {
                    toast.error("Cover image upload failed")
                    return
                }
            }

            // upload logo
            if (restaurantForm.logo) {
                logoUrl = await uploadImage(restaurantForm.logo)
                if (!logoUrl) {
                    toast.error("Logo upload failed")
                    return
                }
            }

            // send JSON (not FormData)
            const payload = {
                name: restaurantForm.name,
                description: restaurantForm.description,
                address: restaurantForm.address,
                phone: restaurantForm.phone,
                email: restaurantForm.email,
                cuisine_type: restaurantForm.cuisine_type,
                opening_hours: restaurantForm.opening_hours,
                manager_id: createdManager.id,
                cover_image: coverImageUrl,
                logo: logoUrl,
            }

            const res = await api.post('/restaurants/', payload)

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

    const handlePrint = () => window.print()

    // Filter managers by search query
    const filteredManagers = availableManagers.filter((m) => {
        const q = managerSearch.toLowerCase()
        return (
            m.first_name.toLowerCase().includes(q) ||
            m.last_name.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
        )
    })

    // Step labels
    const steps = [
        { number: 1, label: 'Manager Setup' },
        { number: 2, label: 'Restaurant Info' },
        { number: 3, label: 'Receipt' },
    ]

    return (
        <div className="min-h-screen bg-brand-white-soft">
            <div className="print:hidden">
                <Navbar />
            </div>

            <div className="container-main py-8 max-w-2xl">

                {/* Back */}
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
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                text-sm font-bold transition-all
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

                {/* ══════════════════════════════════════
            STEP 1 — Manager Setup
        ══════════════════════════════════════ */}
                {step === 1 && (
                    <div className="card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center">
                                <User size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-brand-black">Manager Setup</h1>
                                <p className="text-sm text-brand-gray">
                                    Create a new manager or assign an existing one
                                </p>
                            </div>
                        </div>

                        {/* Mode toggle — NEW or EXISTING */}
                        <div className="flex gap-2 p-1.5 bg-brand-white-mid rounded-2xl mb-6">
                            <button
                                onClick={() => {
                                    setManagerMode('new')
                                    setSelectedExistingManager(null)
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                            text-sm font-semibold transition-all
                            ${managerMode === 'new'
                                        ? 'bg-brand-black text-white shadow-sm'
                                        : 'text-brand-gray hover:text-brand-black'}`}>
                                <UserPlus size={16} />
                                Create New Manager
                            </button>
                            <button
                                onClick={() => {
                                    setManagerMode('existing')
                                    setManagerForm({
                                        first_name: '', last_name: '', username: '',
                                        email: '', phone: '', password: '', password_confirm: '',
                                    })
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                            text-sm font-semibold transition-all
                            ${managerMode === 'existing'
                                        ? 'bg-brand-black text-white shadow-sm'
                                        : 'text-brand-gray hover:text-brand-black'}`}>
                                <Users size={16} />
                                Choose Existing
                            </button>
                        </div>

                        {/* ── NEW MANAGER FORM ── */}
                        {managerMode === 'new' && (
                            <form onSubmit={handleNewManagerSubmit} className="space-y-4">

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
                                        Username *
                                        <span className="text-brand-gray font-normal ml-1">(used to log in)</span>
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

                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Temporary Password *
                                        <span className="text-brand-gray font-normal ml-1">
                                            (appears on receipt)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password" value={managerForm.password}
                                            onChange={handleManagerChange} required
                                            placeholder="Set a temporary password"
                                            className="input-field pr-12" />
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
                                        Confirm Password *
                                    </label>
                                    <input
                                        type="password" name="password_confirm"
                                        value={managerForm.password_confirm}
                                        onChange={handleManagerChange} required
                                        placeholder="Repeat the password"
                                        className="input-field" />
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Next — Restaurant Info <ChevronRight size={18} /></>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* ── EXISTING MANAGER PICKER ── */}
                        {managerMode === 'existing' && (
                            <div className="space-y-4">

                                {/* Search box */}
                                <div className="relative">
                                    <Search size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={managerSearch}
                                        onChange={(e) => setManagerSearch(e.target.value)}
                                        placeholder="Search by name, username or email..."
                                        className="input-field pl-10" />
                                </div>

                                {/* Manager list */}
                                {managersLoading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i}
                                                className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredManagers.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Users size={36} className="text-gray-300 mx-auto mb-2" />
                                        <p className="font-semibold text-brand-black">
                                            {availableManagers.length === 0
                                                ? 'No unassigned managers found'
                                                : 'No managers match your search'}
                                        </p>
                                        <p className="text-sm text-brand-gray mt-1">
                                            {availableManagers.length === 0
                                                ? 'All existing managers already have restaurants, or none exist yet.'
                                                : 'Try a different search term'}
                                        </p>
                                        {/* Quick switch to create new */}
                                        {availableManagers.length === 0 && (
                                            <button
                                                onClick={() => setManagerMode('new')}
                                                className="btn-primary mt-4 text-sm">
                                                Create New Manager Instead
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {filteredManagers.map((manager) => {
                                            const isSelected = selectedExistingManager?.id === manager.id
                                            return (
                                                <button
                                                    key={manager.id}
                                                    onClick={() => setSelectedExistingManager(manager)}
                                                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2
                                      text-left transition-all
                                      ${isSelected
                                                            ? 'border-brand-black bg-brand-black text-white'
                                                            : 'border-gray-100 bg-white hover:border-gray-300'}`}>

                                                    {/* Avatar initial */}
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                          flex-shrink-0 font-bold text-sm
                                          ${isSelected
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-brand-black text-white'}`}>
                                                        {manager.first_name?.[0]?.toUpperCase() || '?'}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-semibold truncate
                                          ${isSelected ? 'text-white' : 'text-brand-black'}`}>
                                                            {manager.first_name} {manager.last_name}
                                                        </p>
                                                        <p className={`text-xs truncate
                                          ${isSelected ? 'text-gray-300' : 'text-brand-gray'}`}>
                                                            @{manager.username} · {manager.email}
                                                        </p>
                                                    </div>

                                                    {/* Selected checkmark */}
                                                    {isSelected && (
                                                        <CheckCircle size={20} className="text-brand-accent flex-shrink-0" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Selected manager summary */}
                                {selectedExistingManager && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-3
                                  flex items-center gap-2 text-sm">
                                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                        <span className="text-green-800">
                                            <span className="font-semibold">
                                                {selectedExistingManager.first_name} {selectedExistingManager.last_name}
                                            </span>
                                            {' '}will be assigned as manager
                                        </span>
                                    </div>
                                )}

                                {/* Confirm and proceed */}
                                <button
                                    onClick={handleExistingManagerConfirm}
                                    disabled={!selectedExistingManager}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl
                              font-semibold text-sm transition-all
                              ${selectedExistingManager
                                            ? 'btn-primary'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                    Next — Restaurant Info <ChevronRight size={18} />
                                </button>

                                {/* Available count */}
                                {availableManagers.length > 0 && (
                                    <p className="text-center text-xs text-brand-gray">
                                        {availableManagers.length} unassigned manager
                                        {availableManagers.length !== 1 ? 's' : ''} available
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════
            STEP 2 — Restaurant details
        ══════════════════════════════════════ */}
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
                                    {!createdManager?.isNew && (
                                        <span className="ml-1 badge-green">existing</span>
                                    )}
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

                            {/* Cover image */}
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
                                       bg-black/40 cursor-pointer opacity-0 hover:opacity-100
                                       transition-opacity">
                                                <span className="text-white text-sm font-semibold">Change</span>
                                                <input type="file" accept="image/*" className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'cover_image')} />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center gap-2 cursor-pointer">
                                            <Upload size={24} className="text-gray-400" />
                                            <span className="text-sm text-brand-gray">
                                                Click to upload cover photo
                                            </span>
                                            <input type="file" accept="image/*" className="hidden"
                                                onChange={(e) => handleFileChange(e, 'cover_image')} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Logo
                                </label>
                                <div className="flex items-center gap-4">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo"
                                            className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-gray-100
                                    flex items-center justify-center">
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

                            <button
                                type="submit" disabled={loading}
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

                {/* ══════════════════════════════════════
            STEP 3 — Printable receipt
        ══════════════════════════════════════ */}
                {step === 3 && createdManager && createdRestaurant && (
                    <div>
                        {/* Print button */}
                        <div className="print:hidden flex justify-end mb-4">
                            <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
                                <Printer size={18} />
                                Print Receipt
                            </button>
                        </div>

                        {/* Receipt card */}
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
                                        year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                            </div>

                            <div className="p-8 space-y-6 print:p-6">

                                {/* Welcome */}
                                <div className="text-center py-4 border-b border-dashed border-gray-200">
                                    <CheckCircle size={40} className="text-green-500 mx-auto mb-2" />
                                    <h2 className="text-xl font-black text-brand-black">
                                        Welcome to FoodCourt!
                                    </h2>
                                    <p className="text-brand-gray text-sm mt-1">
                                        {createdManager.isNew
                                            ? 'Your restaurant and manager account have been set up successfully.'
                                            : 'Your restaurant has been registered and assigned to an existing manager.'}
                                    </p>
                                </div>

                                {/* Restaurant info */}
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

                                {/* Manager info */}
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
                                        <Row
                                            label="Account Type"
                                            value={createdManager.isNew ? 'Newly Created' : 'Existing Account'}
                                        />
                                    </div>
                                </div>

                                {/* Login credentials — only shown for newly created managers */}
                                {createdManager.isNew && (
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
                                )}

                                {/* Existing manager — no password shown */}
                                {!createdManager.isNew && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-sm text-blue-800 text-center">
                                            <span className="font-bold">
                                                {createdManager.first_name} {createdManager.last_name}
                                            </span>
                                            {' '}already has login credentials and can access the dashboard immediately.
                                        </p>
                                    </div>
                                )}

                                {/* What's next */}
                                <div className="border-t border-dashed border-gray-200 pt-4">
                                    <h3 className="text-xs font-bold text-brand-gray uppercase tracking-widest mb-3">
                                        What's Next
                                    </h3>
                                    <div className="space-y-2">
                                        {[
                                            createdManager.isNew
                                                ? 'Share these credentials with the manager'
                                                : 'Inform the manager their restaurant is now live',
                                            'Manager logs in and goes to their Dashboard',
                                            'Add menu items with photos and prices',
                                            'Start receiving orders in real time',
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-2.5 text-sm text-brand-gray">
                                                <span className="w-5 h-5 rounded-full bg-brand-black text-white text-xs
                                         font-bold flex items-center justify-center
                                         flex-shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Receipt footer */}
                                <div className="border-t border-dashed border-gray-200 pt-4 text-center">
                                    <p className="text-xs text-gray-400">
                                        Generated by FoodCourt Platform Admin
                                    </p>
                                    {createdManager.isNew && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Keep this document safe — it contains login credentials
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Back button */}
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

// Receipt row helper
const Row = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-brand-gray">{label}</span>
        <span className={`font-semibold ${highlight ? 'text-green-600' : 'text-brand-black'}`}>
            {value}
        </span>
    </div>
)

export default RegisterRestaurant