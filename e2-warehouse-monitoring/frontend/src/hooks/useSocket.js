import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5001'); // Your backend WebSocket URL

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        return () => {
            socket.off('connect');
            socket.off('disconnect');
        };
    }, []);

    return { socket, isConnected };
};

