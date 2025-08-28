import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../App.css';

const ManagementLayout = ({ title, children }) => {
    const { user } = useAuth();

    return (
        <div className="management-layout">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>{title}</h2>
                    {user && <p style={{ margin: 0, color: 'var(--text-medium)' }}>Signed in as {user.name} ({user.role})</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to="/warehouse" className="button" style={{ textDecoration: 'none' }}>Dashboard</Link>
                </div>
            </header>
            <nav className="top-nav">
                <Link to="/manage/zones" className="top-link">Zones</Link>
                <Link to="/manage/sensors" className="top-link">Sensors</Link>
                <Link to="/manage/users" className="top-link">Users</Link>
            </nav>

            <section>
                {children}
            </section>
        </div>
    );
};

export default ManagementLayout;