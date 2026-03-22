// api/axios.js — Axios instance with JWT interceptor

import axios from 'axios'

// Base URL for all API requests
const api = axios.create({
    baseURL: 'https://foodcourt-production.up.railway.app/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Attach JWT token to every request if it exists in localStorage
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        // For file uploads, let browser set Content-Type automatically
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type']
        }
        return config
    },
    (error) => Promise.reject(error)
)

// If token is expired (401), try to refresh it
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            const refreshToken = localStorage.getItem('refresh_token')

            if (refreshToken) {
                try {
                    const res = await axios.post('/api/auth/token/refresh/', { refresh: refreshToken })
                    localStorage.setItem('access_token', res.data.access)
                    originalRequest.headers.Authorization = `Bearer ${res.data.access}`
                    return api(originalRequest)
                } catch {
                    // Refresh failed — clear tokens and redirect to login
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('refresh_token')
                    window.location.href = '/login'
                }
            }
        }

        return Promise.reject(error)
    }
)

export default api