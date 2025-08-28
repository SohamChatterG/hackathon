import React from 'react';

const ZoneCard = ({ zone, onOpen }) => {
    return (
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onOpen(zone)}>
            <h3 className="card-title">{zone.name}</h3>
            <p style={{ color: 'var(--text-medium)', marginTop: 6 }}>{zone.description || 'No description'}</p>
            <div style={{ marginTop: 12, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{zone.sensorCount ?? '—'}</div>
                <div style={{ color: 'var(--text-medium)' }}>Sensors</div>
            </div>
        </div>
    );
};

export default ZoneCard;
