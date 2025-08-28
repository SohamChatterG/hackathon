import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertsPanel from '../components/AlertsPanel';
import LiveSensors from '../components/LiveSensors';

const WarehouseDashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div className="dashboard">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Warehouse Dashboard</h1>
                    <p>Welcome, {user?.name} ({user?.role})</p>
                </div>
                <div>
                    {user?.role === 'Admin' && (
                        <Link to="/manage/zones" style={{ marginRight: '1rem', textDecoration: 'none', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '0.375rem' }}>
                            Admin Panel
                        </Link>
                    )}
                    <button onClick={logout} style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', border: 'none', borderRadius: '0.375rem', color: 'white', cursor: 'pointer' }}>Logout</button>
                </div>
            </header>
            <main className="dashboard-grid">
                <LiveSensors />
                <AlertsPanel />
            </main>
        </div>
    );
};
export default WarehouseDashboard;

