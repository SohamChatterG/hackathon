// FILE: frontend/src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('Operator'); // <-- NEW: Add state for role, default to Operator
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Pass the role state to the register function
            await register({ name, email, password, phoneNumber, role });
            alert('Registration successful! Please sign in.');
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Failed to register. Please try again.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-form-container">
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>Create Account</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">Full Name</label>
                        <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email address</label>
                        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input id="password" type="password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phoneNumber" className="form-label">Phone Number (Optional)</label>
                        <input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="form-input" />
                    </div>

                    {/* --- NEW DROPDOWN FOR ROLE --- */}
                    <div className="form-group">
                        <label htmlFor="role" className="form-label">Role</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="form-input"
                        >
                            <option value="Operator">Operator</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    {/* ----------------------------- */}

                    {error && <p className="form-error">{error}</p>}
                    <button type="submit" className="submit-button">Sign Up</button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;