// pages/dashboard/RegisterRestaurant.jsx — Admin registers a new restaurant

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Store, ArrowLeft, Upload } from 'lucide-react'

const RegisterRestaurant = () => {
    const navigate = useNavigate()
    const [managers, setManagers] = useState([])
    const [loading, setLoading] = useState(false)
    const [coverPreview, setCoverPreview] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)

    const [formData, setFormData] = useState({
        manager_id: '',
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

    // Load all restaurant manager users
    useEffect(() => {
        fetchManagers()
    }, [])

    const fetchManagers = async () => {
        try {
            const res = await api.get('/auth/users/')
            // Filter to only restaurant_manager role users
            const mgrs = res.data.filter((u) => u.role === 'restaurant_manager')
            setManagers(mgrs)
        } catch (err) {
            console.error(err)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e, field) => {
        const file = e.target.files[0]
        if (!file) return
        setFormData({ ...formData, [field]: file })

        // Preview image
        const reader = new FileReader()
        reader.onload = (ev) => {
            if (field === 'cover_image') setCoverPreview(ev.target.result)
            else setLogoPreview(ev.target.result)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.manager_id) {
            toast.error('Please select a manager')
            return
        }

        setLoading(true)
        try {
            // Use FormData for file uploads
            const data = new FormData()
            Object.entries(formData).forEach(([key, val]) => {
                if (val !== null && val !== '') data.append(key, val)
            })

            await api.post('/restaurants/', data)
            toast.success('Restaurant registered successfully!')
            navigate('/admin')
        } catch (err) {
            const errors = err.response?.data
            if (errors) {
                Object.values(errors).flat().forEach((msg) => toast.error(msg))
            } else {
                toast.error('Failed to register restaurant')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-brand-white-soft">
            <Navbar />
            <div className="container-main py-8 max-w-2xl">

                {/* Back */}
                <button onClick={() => navigate('/admin')}
                    className="flex items-center gap-1.5 text-sm text-brand-gray hover:text-brand-black mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Admin
                </button>

                <div className="card p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center">
                            <Store size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-brand-black">Register Restaurant</h1>
                            <p className="text-sm text-brand-gray">Add a new restaurant to the platform</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Manager selection */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-black mb-1.5">
                                Restaurant Manager *
                            </label>
                            <select name="manager_id" value={formData.manager_id}
                                onChange={handleChange} required className="input-field">
                                <option value="">Select a manager...</option>
                                {managers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.first_name} {m.last_name} ({m.email})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-brand-gray mt-1">
                                Only users with "Restaurant Manager" role appear here
                            </p>
                        </div>

                        {/* Restaurant name */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-black mb-1.5">Restaurant Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange}
                                required placeholder="e.g. The Nairobi Grill" className="input-field" />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-black mb-1.5">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange}
                                rows={3} placeholder="Brief description of the restaurant..."
                                className="input-field resize-none" />
                        </div>

                        {/* Address & Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">Address *</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange}
                                    required placeholder="123 Kenyatta Ave, Nairobi" className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">Phone *</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                    required placeholder="+254 700 000 000" className="input-field" />
                            </div>
                        </div>

                        {/* Email & Cuisine */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange}
                                    placeholder="restaurant@email.com" className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-brand-black mb-1.5">Cuisine Type</label>
                                <input type="text" name="cuisine_type" value={formData.cuisine_type} onChange={handleChange}
                                    placeholder="e.g. Kenyan, Italian, BBQ" className="input-field" />
                            </div>
                        </div>

                        {/* Opening hours */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-black mb-1.5">Opening Hours</label>
                            <input type="text" name="opening_hours" value={formData.opening_hours} onChange={handleChange}
                                placeholder="e.g. 9AM - 10PM" className="input-field" />
                        </div>

                        {/* Cover image */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-black mb-1.5">Cover Image</label>
                            <div className={`border-2 border-dashed border-gray-200 rounded-xl overflow-hidden
                              ${coverPreview ? 'p-0' : 'p-6'} hover:border-gray-400 transition-colors`}>
                                {coverPreview ? (
                                    <div className="relative">
                                        <img src={coverPreview} alt="Cover preview" className="w-full h-40 object-cover" />
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 
                                     cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-white text-sm font-semibold">Change Image</span>
                                            <input type="file" accept="image/*" className="hidden"
                                                onChange={(e) => handleFileChange(e, 'cover_image')} />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                                        <Upload size={24} className="text-gray-400" />
                                        <span className="text-sm text-brand-gray">Click to upload cover image</span>
                                        <input type="file" accept="image/*" className="hidden"
                                            onChange={(e) => handleFileChange(e, 'cover_image')} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Logo */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-black mb-1.5">Restaurant Logo</label>
                            <div className="flex items-center gap-4">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo preview"
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

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Store size={18} /> Register Restaurant</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default RegisterRestaurant