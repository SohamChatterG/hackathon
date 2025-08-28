import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Resilient singleton socket instance shared across the app
// Use Vite's import.meta.env in the browser; provide a safe fallback.
const SOCKET_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:5001';
let socketInstance;

const getSocket = () => {
    if (socketInstance) return socketInstance;
    socketInstance = io(SOCKET_URL, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ['websocket', 'polling'],
    });
    return socketInstance;
};

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    useEffect(() => {
        const socket = getSocket();

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        // Connect on mount if not already connected
        if (!socket.connected) socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            // do not fully disconnect here to preserve socket for other components,
            // but keep listeners cleaned up to avoid duplicate handlers on remount.
        };
    }, []);

    return { socket: getSocket(), isConnected };
};

