import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertsPanel from '../components/AlertsPanel';
import LiveSensors from '../components/LiveSensors';


const WarehouseDashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div className="dashboard landing-loveable-bg">
            <header className="dashboard-header landing-header-distinct" style={{marginBottom: 0, display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:'84px', padding:'0 2.5rem 0 2.5rem'}}>
                <div className="dashboard-header-left" style={{display:'flex',alignItems:'center',gap:'1.5rem'}}>
                    <h1 className="dashboard-title" style={{fontSize:'2.2rem',fontWeight:'bold',background:'linear-gradient(90deg,#60A5FA,#0ea5b7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',margin:0}}>Warehouse Dashboard</h1>
                    <span className="dashboard-welcome" style={{color:'var(--text-medium)',fontSize:'1.1rem'}}>Welcome, <span style={{color:'var(--text-light)',fontWeight:600}}>{user?.name}</span> ({user?.role})</span>
                </div>
                <div className="dashboard-header-actions" style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                    {user?.role === 'Admin' && (
                        <Link to="/manage/zones" className="button" style={{border:'1.5px solid var(--primary-color)',background:'transparent',color:'var(--primary-color)',fontWeight:500}}>Admin Panel</Link>
                    )}
                    <button onClick={logout} className="button" style={{background:'#ef5350',color:'#fff',fontWeight:500}}>Logout</button>
                </div>
            </header>
            <main className="dashboard-grid" style={{display:'grid', gridTemplateColumns:'2.5fr 1fr', gap:'2.5rem', width:'100%', padding:0, margin:0}}>
                <div style={{paddingLeft:'2.5rem'}}>
                    <LiveSensors />
                </div>
                <div style={{paddingRight:'2.5rem'}}>
                    <AlertsPanel />
                </div>
            </main>
        </div>
    );
};
export default WarehouseDashboard;

