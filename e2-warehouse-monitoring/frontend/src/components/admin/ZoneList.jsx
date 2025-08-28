import React from 'react';

const ZoneList = ({ zones, onEdit, onDelete }) => (
    <div className="zone-list-container">
        {zones.length === 0 ? <p>No zones found.</p> : (
            <ul className="zone-list">
                {zones.map(zone => (
                    <li key={zone._id} className="zone-list-item">
                        <div>
                            <p className="zone-name">{zone.name}</p>
                            <p className="zone-description">{zone.description}</p>
                        </div>
                        <div className="zone-actions">
                            <button onClick={() => onEdit(zone)} className="edit-button">Edit</button>
                            <button onClick={() => onDelete(zone._id)} className="delete-button">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </div>
);
export default ZoneList;
