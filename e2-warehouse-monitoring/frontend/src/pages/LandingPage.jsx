
import React from 'react';
import { Link } from 'react-router-dom';


// Handshake SVG (distinct logo)
const HandshakeIcon = () => (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="40" height="40" rx="12" fill="#1e293b" stroke="#60A5FA" strokeWidth="2"/>
        <path d="M13 25l6 6c1.5 1.5 4 1.5 5.5 0l6-6" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 21l5 5 5-5" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="22" cy="18" r="2.5" fill="#60A5FA"/>
    </svg>
);
const ThermometerIcon = () => (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="40" height="40" rx="12" fill="#1e293b" stroke="#60A5FA" strokeWidth="2"/>
        <rect x="20" y="10" width="4" height="16" rx="2" fill="#60A5FA"/>
        <circle cx="22" cy="30" r="5" fill="#60A5FA"/>
        <rect x="20" y="10" width="4" height="10" rx="2" fill="#1e293b"/>
    </svg>
);

const LandingPage = () => (
    <div className="landing-loveable-bg">
            <header className="landing-header landing-header-distinct">
                <div className="logo-title">
                    <span className="logo-icon" />
                    <span className="logo-text">SCM <span style={{ color: '#60A5FA' }}>Solutions</span></span>
                </div>
                <nav className="landing-nav">
                    <Link to="#about">About</Link>
                    <Link to="#contact">Contact</Link>
                </nav>
            </header>
        <main className="landing-main">
            <h1 className="landing-title">Welcome to <span className="landing-title-accent">SCM Solutions Ltd</span></h1>
            <p className="landing-subtitle">Choose your portal to continue and unlock professional supply chain management tools</p>
                    <div className="portal-cards">
                        <div className="portal-card portal-card-standout">
                            <div className="portal-card-icon"><HandshakeIcon /></div>
                            <div className="portal-card-content">
                                <h2>Distribution Management</h2>
                                <p>Access project planning tools, resource allocation, and timeline management for comprehensive financial oversight</p>
                            </div>
                            <Link to="#" className="portal-card-btn disabled">Enter Distribution Management</Link>
                        </div>
                        <div className="portal-card portal-card-standout">
                            <div className="portal-card-icon"><ThermometerIcon /></div>
                            <div className="portal-card-content">
                                <h2>Warehouse Temperature Monitoring</h2>
                                <p>Monitor and manage warehouse temperature controls, environmental conditions, and equipment status with real-time analytics</p>
                            </div>
                            <Link to="/warehouse" className="portal-card-btn">Enter Temperature Monitoring</Link>
                        </div>
                    </div>
        </main>
    </div>
);

export default LandingPage;
