// FILE: frontend/src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WarehouseDashboard from './pages/WarehouseDashboard';
import ManageZonesPage from './pages/ManageZonesPage';
import ManageSensorsPage from './pages/ManageSensorsPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';
import './index.css';

function App() {
  // The top-level loading check is no longer needed here.
  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/warehouse"
          element={
            <ProtectedRoute>
              <WarehouseDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/manage/zones" element={<AdminRoute><ManageZonesPage /></AdminRoute>} />
        <Route path="/manage/sensors" element={<AdminRoute><ManageSensorsPage /></AdminRoute>} />
        <Route path="/manage/users" element={<AdminRoute><ManageUsersPage /></AdminRoute>} />
      </Routes>
    </div>
  );
}

export default App;