// pages/dashboard/RestaurantSettings.jsx
// Restaurant manager can edit restaurant info, change cover image,
// logo, and reassign the manager from here

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import {
    ArrowLeft, Upload, Save, Store,
    Users, Search, CheckCircle
} from 'lucide-react'

const RestaurantSettings = () => {
    const navigate = useNavigate()

    const [restaurant, setRestaurant] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('general')

    // Image previews
    const [coverPreview, setCoverPreview] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)

    // Form state — pre-filled from restaurant data
    const [form, setForm] = useState({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        cuisine_type: '',
        opening_hours: '',
        cover_image: null,
        logo: null,
    })

    // Manager change state
    const [availableManagers, setAvailableManagers] = useState([])
    const [managersLoading, setManagersLoading] = useState(false)
    const [managerSearch, setManagerSearch] = useState('')
    const [selectedManager, setSelectedManager] = useState(null)
    const [changingManager, setChangingManager] = useState(false)

    useEffect(() => {
        fetchRestaurant()
    }, [])

    const fetchRestaurant = async () => {
        try {
            const res = await api.get('/restaurants/my-restaurant/')
            setRestaurant(res.data)
            // Pre-fill form with existing data
            setForm({
                name: res.data.name || '',
                description: res.data.description || '',
                address: res.data.address || '',
                phone: res.data.phone || '',
                email: res.data.email || '',
                cuisine_type: res.data.cuisine_type || '',
                opening_hours: res.data.opening_hours || '',
                cover_image: null,
                logo: null,
            })
        } catch (err) {
            toast.error('Failed to load restaurant')
        } finally {
            setLoading(false)
        }
    }

    const fetchAvailableManagers = async () => {
        setManagersLoading(true)
        try {
            const [usersRes, restRes] = await Promise.all([
                api.get('/auth/users/'),
                api.get('/restaurants/'),
            ])
            const allManagers = usersRes.data.filter(
                (u) => u.role === 'restaurant_manager'
            )
            const takenIds = restRes.data
                .filter((r) => r.id !== restaurant?.id) // exclude current restaurant
                .map((r) => r.manager_info?.id)
            // Show managers who are free OR currently this restaurant's manager
            setAvailableManagers(
                allManagers.filter((m) => !takenIds.includes(m.id))
            )
        } catch {
            toast.error('Failed to load managers')
        } finally {
            setManagersLoading(false)
        }
    }

    // Load managers when switching to manager tab
    useEffect(() => {
        if (activeTab === 'manager') {
            fetchAvailableManagers()
        }
    }, [activeTab])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e, field) => {
        const file = e.target.files[0]
        if (!file) return
        setForm({ ...form, [field]: file })
        const reader = new FileReader()
        reader.onload = (ev) => {
            if (field === 'cover_image') setCoverPreview(ev.target.result)
            else setLogoPreview(ev.target.result)
        }
        reader.readAsDataURL(file)
    }

    const handleSaveGeneral = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const data = new FormData()
            Object.entries(form).forEach(([key, val]) => {
                if (val !== null && val !== '') data.append(key, val)
            })
            const res = await api.put(`/restaurants/${restaurant.id}/`, data)
            setRestaurant(res.data)
            toast.success('Restaurant settings saved!')
        } catch (err) {
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const handleChangeManager = async () => {
        if (!selectedManager) {
            toast.error('Please select a manager')
            return
        }
        setChangingManager(true)
        try {
            // We update the restaurant passing new manager_id
            const data = new FormData()
            data.append('manager_id', selectedManager.id)
            await api.put(`/restaurants/${restaurant.id}/`, data)
            toast.success(
                `Manager changed to ${selectedManager.first_name} ${selectedManager.last_name}`
            )
            // Redirect — current user is no longer the manager so dashboard access ends
            navigate('/')
        } catch (err) {
            toast.error('Failed to change manager')
        } finally {
            setChangingManager(false)
        }
    }

    const filteredManagers = availableManagers.filter((m) => {
        const q = managerSearch.toLowerCase()
        return (
            m.first_name.toLowerCase().includes(q) ||
            m.last_name.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
        )
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-white-soft">
                <Navbar />
                <div className="container-main py-8">
                    <div className="card p-8 animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3" />
                        <div className="h-40 bg-gray-100 rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-brand-white-soft">
            <Navbar />

            <div className="container-main py-8 max-w-2xl">

                {/* Back */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1.5 text-sm text-brand-gray
                     hover:text-brand-black mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <h1 className="text-2xl font-black text-brand-black mb-6">
                    Restaurant Settings
                </h1>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-card mb-6 w-fit">
                    {[
                        { key: 'general', icon: Store, label: 'General' },
                        { key: 'manager', icon: Users, label: 'Change Manager' },
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

                {/* ── GENERAL TAB ── */}
                {activeTab === 'general' && (
                    <div className="card p-8">
                        <form onSubmit={handleSaveGeneral} className="space-y-5">

                            {/* Cover image */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Cover Image
                                </label>
                                <div className="relative rounded-xl overflow-hidden border-2
                                border-dashed border-gray-200 hover:border-gray-400
                                transition-colors">
                                    {coverPreview || restaurant?.cover_image_url ? (
                                        <div className="relative h-44">
                                            <img
                                                src={coverPreview || restaurant.cover_image_url}
                                                alt="Cover"
                                                className="w-full h-full object-cover"
                                            />
                                            <label className="absolute inset-0 flex items-center justify-center
                                       bg-black/40 cursor-pointer opacity-0 hover:opacity-100
                                       transition-opacity">
                                                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                                    <Upload size={16} /> Change Cover
                                                </div>
                                                <input type="file" accept="image/*" className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'cover_image')} />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center gap-2 p-8 cursor-pointer">
                                            <Upload size={24} className="text-gray-400" />
                                            <span className="text-sm text-brand-gray">Upload cover photo</span>
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
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0
                                  flex items-center justify-center">
                                        {logoPreview || restaurant?.logo_url ? (
                                            <img
                                                src={logoPreview || restaurant.logo_url}
                                                alt="Logo"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Store size={24} className="text-gray-300" />
                                        )}
                                    </div>
                                    <label className="btn-secondary text-sm cursor-pointer">
                                        <Upload size={14} className="inline mr-1.5" />
                                        Change Logo
                                        <input type="file" accept="image/*" className="hidden"
                                            onChange={(e) => handleFileChange(e, 'logo')} />
                                    </label>
                                </div>
                            </div>

                            {/* Restaurant name */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Restaurant Name *
                                </label>
                                <input
                                    type="text" name="name" value={form.name}
                                    onChange={handleChange} required
                                    className="input-field"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    name="description" value={form.description}
                                    onChange={handleChange} rows={3}
                                    className="input-field resize-none"
                                />
                            </div>

                            {/* Address & Phone */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Address
                                    </label>
                                    <input
                                        type="text" name="address" value={form.address}
                                        onChange={handleChange} className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Phone
                                    </label>
                                    <input
                                        type="tel" name="phone" value={form.phone}
                                        onChange={handleChange} className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Email & Cuisine */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        type="email" name="email" value={form.email}
                                        onChange={handleChange} className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                        Cuisine Type
                                    </label>
                                    <input
                                        type="text" name="cuisine_type" value={form.cuisine_type}
                                        onChange={handleChange} className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Opening hours */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                    Opening Hours
                                </label>
                                <input
                                    type="text" name="opening_hours" value={form.opening_hours}
                                    onChange={handleChange} placeholder="e.g. 9AM - 10PM"
                                    className="input-field"
                                />
                            </div>

                            <button
                                type="submit" disabled={saving}
                                className="btn-primary flex items-center gap-2 py-3 px-8">
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white
                                  rounded-full animate-spin" />
                                ) : (
                                    <><Save size={16} /> Save Settings</>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── CHANGE MANAGER TAB ── */}
                {activeTab === 'manager' && (
                    <div className="card p-8 space-y-5">

                        {/* Current manager */}
                        <div>
                            <p className="text-xs font-bold text-brand-gray uppercase tracking-widest mb-3">
                                Current Manager
                            </p>
                            <div className="flex items-center gap-3 p-3.5 bg-brand-white-mid rounded-xl">
                                <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center
                                justify-center font-bold text-white text-sm">
                                    {restaurant?.manager_info?.first_name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-brand-black">
                                        {restaurant?.manager_info?.first_name}{' '}
                                        {restaurant?.manager_info?.last_name}
                                    </p>
                                    <p className="text-xs text-brand-gray">
                                        @{restaurant?.manager_info?.username}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-800">
                                <span className="font-bold">Warning:</span> Changing the manager
                                will remove your own access to this dashboard immediately.
                                Make sure the new manager has their login credentials.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={managerSearch}
                                onChange={(e) => setManagerSearch(e.target.value)}
                                placeholder="Search managers..."
                                className="input-field pl-10"
                            />
                        </div>

                        {/* Manager list */}
                        {managersLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredManagers.length === 0 ? (
                            <div className="text-center py-8">
                                <Users size={32} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-brand-gray text-sm">No available managers found</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {filteredManagers.map((manager) => {
                                    const isCurrent = manager.id === restaurant?.manager_info?.id
                                    const isSelected = selectedManager?.id === manager.id
                                    return (
                                        <button
                                            key={manager.id}
                                            onClick={() => !isCurrent && setSelectedManager(manager)}
                                            disabled={isCurrent}
                                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2
                                  text-left transition-all
                                  ${isCurrent
                                                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'border-brand-black bg-brand-black text-white'
                                                        : 'border-gray-100 bg-white hover:border-gray-300'}`}>
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                                      font-bold text-sm flex-shrink-0
                                      ${isSelected ? 'bg-white/20 text-white' : 'bg-brand-black text-white'}`}>
                                                {manager.first_name?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold truncate text-sm
                                      ${isSelected ? 'text-white' : 'text-brand-black'}`}>
                                                    {manager.first_name} {manager.last_name}
                                                    {isCurrent && (
                                                        <span className="ml-2 text-xs text-gray-400">(current)</span>
                                                    )}
                                                </p>
                                                <p className={`text-xs truncate
                                      ${isSelected ? 'text-gray-300' : 'text-brand-gray'}`}>
                                                    @{manager.username}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle size={18} className="text-brand-accent flex-shrink-0" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Selected summary */}
                        {selectedManager && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3
                              flex items-center gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                <span className="text-green-800">
                                    <span className="font-semibold">
                                        {selectedManager.first_name} {selectedManager.last_name}
                                    </span>
                                    {' '}will become the new manager
                                </span>
                            </div>
                        )}

                        <button
                            onClick={handleChangeManager}
                            disabled={!selectedManager || changingManager}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl
                          font-semibold text-sm transition-all
                          ${selectedManager
                                    ? 'btn-primary'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            {changingManager ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white
                                rounded-full animate-spin" />
                            ) : (
                                <><Users size={16} /> Confirm Manager Change</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RestaurantSettings