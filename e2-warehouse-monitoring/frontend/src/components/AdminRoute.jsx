// FILE: frontend/src/components/AdminRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    // 1. First, check if a user is logged in at all.
    //    If not, redirect them to the login page and save the location
    //    they were trying to access.
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. If a user is logged in, check if their role is 'Admin'.
    //    If it's not, redirect them away from the admin page to the main dashboard.
    if (user.role !== 'Admin') {
        return <Navigate to="/warehouse" replace />;
    }

    // 3. If the user is logged in AND their role is 'Admin',
    //    show the protected admin page.
    return children;
};

export default AdminRoute;