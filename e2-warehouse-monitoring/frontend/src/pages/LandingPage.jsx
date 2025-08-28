import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => (
    <div className="landing-page">
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>Welcome</h1>
        <p style={{ fontSize: '1.25rem' }}>Please select a module to continue</p>
        <div style={{ display: 'grid', gap: '2rem', width: '100%', maxWidth: '64rem', gridTemplateColumns: '1fr 1fr' }}>
            <Link to="/warehouse" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="module-card">
                    <h2>Warehouse Monitoring</h2>
                    <p>Real-time temperature and humidity tracking.</p>
                </div>
            </Link>
            <div className="module-card" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <h2>Production Planning</h2>
                <p>(Coming Soon)</p>
            </div>
        </div>
    </div>
);
export default LandingPage;
