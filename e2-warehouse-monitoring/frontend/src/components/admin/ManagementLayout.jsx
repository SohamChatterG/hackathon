import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const ManagementLayout = ({ title, children }) => {
    const { user } = useAuth();

    return (
        <div className="management-layout">
            <aside className="management-sidebar card">
                <div className="sidebar-brand">
                    <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Manage</h2>
                    <p style={{ margin: 0, color: 'var(--text-medium)', fontSize: '0.9rem' }}>Admin Console</p>
                </div>

                <div className="sidebar-user" style={{ marginTop: '1rem' }}>
                    {user && (
                        <>
                            <div style={{ fontWeight: 700 }}>{user.name}</div>
                            <div style={{ color: 'var(--text-medium)', fontSize: '0.85rem' }}>{user.role}</div>
                        </>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <Link to="/manage/zones" className="sidebar-link">Zones</Link>
                    <Link to="/manage/sensors" className="sidebar-link">Sensors</Link>
                    <Link to="/manage/users" className="sidebar-link">Users</Link>
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <Link to="/warehouse" className="button" style={{ textDecoration: 'none', width: '100%', display: 'inline-block' }}>Dashboard</Link>
                </div>
            </aside>

            <main className="management-main">
                <header className="management-header">
                    <div>
                        <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>{title}</h2>
                        {user && <p style={{ margin: '6px 0 0 0', color: 'var(--text-medium)' }}>Signed in as {user.name} ({user.role})</p>}
                    </div>
                </header>

                <section className="management-content">
                    {children}
                </section>
            </main>
        </div>
    );
};

export default ManagementLayout;