// FILE: frontend/src/components/admin/SensorList.jsx

import React from 'react';

// Enhanced sensor list UI
const SensorList = ({ sensors, onSelectSensor, onDeleteSensor, selectedSensorId }) => {
    if (!sensors.length) return <p className="admin-card-sub" style={{ margin:0 }}>No sensors found.</p>;

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
            {sensors.map(sensor => {
                const active = selectedSensorId === sensor._id;
                return (
                    <div
                        key={sensor._id}
                        onClick={() => onSelectSensor(sensor)}
                        className={"sensor-row" + (active ? ' is-active' : '')}
                    >
                        <div className="sensor-row-main">
                            <div className="sensor-id">{sensor.sensorId}</div>
                            <div className="sensor-zone">{sensor.zone ? sensor.zone.name : 'Unassigned'}</div>
                        </div>
                        <div className="sensor-row-actions">
                            <button
                                className="sensor-del-btn"
                                onClick={(e) => { e.stopPropagation(); onDeleteSensor(sensor._id); }}
                                title="Delete sensor"
                            >DEL</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SensorList;