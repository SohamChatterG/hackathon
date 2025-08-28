// FILE: frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // --- CHANGE: Initialize loading to true ---
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                // Set the user state from localStorage
                setUser(JSON.parse(userData));
                // IMPORTANT: Set the authorization header for all future API calls
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (error) {
                // If localStorage data is corrupted, clear it
                localStorage.clear();
            }
        }
        // --- CHANGE: Mark loading as false ONLY after the check is complete ---
        setLoading(false);
    }, []); // This empty dependency array ensures this runs only ONCE on app startup

    const login = async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
    };

    const register = async (userData) => {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete apiClient.defaults.headers.common['Authorization'];
        setUser(null);
        navigate('/login');
    };

    // Do not render the rest of the app until the initial auth check is complete
    if (loading) {
        return <div className="loading-container">Loading Application...</div>;
    }

    return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);