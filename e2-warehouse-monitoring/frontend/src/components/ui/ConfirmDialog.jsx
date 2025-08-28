import React from 'react';

const ConfirmDialog = ({ open, title = 'Confirm', message, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.5)', zIndex: 2000 }}>
            <div style={{ width: 420, background: '#0b1220', padding: 20, borderRadius: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.6)' }}>
                <h3 style={{ marginTop: 0 }}>{title}</h3>
                <p style={{ color: 'var(--text-medium)' }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 12 }}>
                    <button className="button-secondary" onClick={onCancel}>Cancel</button>
                    <button className="submit-button" onClick={onConfirm}>OK</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
