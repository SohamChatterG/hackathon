import React from 'react';

/* Modern styled zone card */
const ZoneCard = ({ zone, onOpen }) => {
    return (
        <div className="admin-card zone-card" onClick={() => onOpen(zone)}>
            <div className="zone-card-header">
                <div style={{ display:'flex', flexDirection:'column', gap:'.35rem', flex:1, minWidth:0 }}>
                    <h3 className="admin-card-title" style={{ fontSize:'1rem', display:'flex', alignItems:'center', gap:'.55rem', margin:0 }}>
                        {zone.name}
                        <span className="zone-chip">ZONE</span>
                    </h3>
                    <p className="admin-card-sub" style={{ margin:0, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {zone.description || 'No description'}
                    </p>
                </div>
                <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.25rem' }}>
                    <div className="zone-count">{zone.sensorCount ?? '—'}</div>
                    <div style={{ fontSize:'.65rem', letterSpacing:'.5px', color:'var(--admin-text-soft)' }}>SENSORS</div>
                </div>
            </div>
        </div>
    );
};

export default ZoneCard;
