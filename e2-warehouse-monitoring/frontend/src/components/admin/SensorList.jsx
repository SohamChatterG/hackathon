// FILE: frontend/src/components/admin/SensorList.jsx

import React from 'react';

const SensorList = ({ sensors, onSelectSensor, onDeleteSensor, selectedSensorId }) => (
    <div className="zone-list-container">
        {sensors.length === 0 ? <p>No sensors found.</p> : (
            <ul className="zone-list">
                {sensors.map(sensor => (
                    <li key={sensor._id} className="zone-list-item"
                        style={{ backgroundColor: selectedSensorId === sensor._id ? 'var(--background-light)' : 'transparent' }}>
                        <div onClick={() => onSelectSensor(sensor)} style={{ flexGrow: 1, cursor: 'pointer' }}>
                            <p className="zone-name">{sensor.sensorId}</p>
                            <p className="zone-description">Zone: {sensor.zone ? sensor.zone.name : 'N/A'}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteSensor(sensor._id); }} className="delete-button">Delete</button>
                    </li>
                ))}
            </ul>
        )}
    </div>
);
export default SensorList;