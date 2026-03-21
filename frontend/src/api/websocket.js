// api/websocket.js — WebSocket connection manager

let socket = null
let listeners = []

// Connect to the Django Channels WebSocket server
export const connectWebSocket = (token, onMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        // Already connected — just add new listener
        listeners.push(onMessage)
        return
    }

    // Connect with JWT token in query string for authentication
    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`
    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
        console.log('🔌 WebSocket connected')
    }

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        // Deliver message to all registered listeners
        listeners.forEach((listener) => listener(data))
    }

    socket.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        socket = null
    }

    socket.onerror = (err) => {
        console.error('WebSocket error:', err)
    }

    listeners = [onMessage]
}

// Subscribe to a restaurant's channel to receive menu updates
export const subscribeToRestaurant = (restaurantId) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'SUBSCRIBE_RESTAURANT',
            restaurant_id: restaurantId,
        }))
    }
}

// Disconnect WebSocket
export const disconnectWebSocket = () => {
    if (socket) {
        socket.close()
        socket = null
        listeners = []
    }
}

// Add a listener to existing connection
export const addMessageListener = (listener) => {
    listeners.push(listener)
    return () => {
        listeners = listeners.filter((l) => l !== listener)
    }
}