import React, { useState } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

/* Modern admin layout (no Tailwind) */
const navLinks = [
    { to: '/manage/zones', label: 'Zones' },
    { to: '/manage/sensors', label: 'Sensors' },
    { to: '/manage/users', label: 'Users' }
];

const ManagementLayout = ({ title, children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    // Example notifications (replace with real data or context as needed)
    const [notifications] = useState([
        'Sensor 12 in Zone A exceeded temperature threshold.',
        'User John Doe added a new sensor.',
        'Humidity alert resolved in Zone B.'
    ]);

    return (
    <div className="admin-shell">
        <aside className={"admin-sidebar" + (collapsed ? ' collapsed' : '')}>
                <div className="admin-sidebar-header">
                <div className="admin-brand">
                    {collapsed ? (
                        <span className="admin-brand-accent">M</span>
                    ) : (
                        <>
                            Manage<span className="admin-brand-accent">.</span>
                        </>
                    )}
                </div>
                {!collapsed && <div style={{ fontSize:'.62rem', letterSpacing:'1px', fontWeight:600, color:'var(--admin-text-soft)', textTransform:'uppercase' }}>Admin Console</div>}
                {user && !collapsed && <div className="admin-user">{user.name} · {user.role}</div>}
                    </div>

        <div className="admin-nav-section">{collapsed ? 'MG' : 'MANAGE'}</div>
                <nav className="admin-nav">
                    {navLinks.map(l => (
            <Link key={l.to} to={l.to} className={"admin-nav-link" + (location.pathname === l.to ? ' active' : '')}><span className="label">{l.label}</span></Link>
                    ))}
                </nav>

        <div className="admin-nav-section">{collapsed ? 'OTH' : 'OTHER'}</div>
                <nav className="admin-nav">
            <Link to="/warehouse" className={"admin-nav-link" + (location.pathname === '/warehouse' ? ' active' : '')}><span className="label">Dashboard</span></Link>
                </nav>

                <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:'.5rem' }}>
            <Link to="/" className="admin-btn outline hide-when-collapsed" style={{ textDecoration:'none', justifyContent:'center' }}>Home</Link>
            <button className="admin-btn outline" style={{ justifyContent:'center' }} onClick={logout}>{collapsed ? '↩' : 'Logout'}</button>
                </div>
            </aside>

            <div className="admin-main">
                <div className="admin-topbar">
                    <div className="admin-topbar-left">
                        <h1 className="admin-topbar-title">{title}</h1>
                        {user && <p className="admin-topbar-sub">Signed in as {user.name}</p>}
                    </div>
                    <div className="admin-topbar-actions">
                                                <button className="admin-icon-btn" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={()=>setCollapsed(c=>!c)}>{collapsed ? '»' : '«'}</button>
                                                <div style={{position:'relative',display:'inline-block'}}>
                                                    <button className="admin-icon-btn" title="Notifications" onClick={()=>setShowNotifications(v=>!v)}>🔔</button>
                                                    {showNotifications && (
                                                        <NotificationDropdown notifications={notifications} onClose={()=>setShowNotifications(false)} />
                                                    )}
                                                </div>
                        <Link to="/warehouse" className="admin-btn outline">Dashboard</Link>
                    </div>
                </div>
                <div className="admin-content fade-in">{children}</div>
            </div>
        </div>
    );
};

export default ManagementLayout;