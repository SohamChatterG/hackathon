import { useState, useEffect } from 'react';


const AssignZonesForm = ({ user, allZones, onSubmit }) => {
    const [assignedZones, setAssignedZones] = useState(new Set(user.zones.map(z => z._id)));

    useEffect(() => {
        setAssignedZones(new Set(user.zones.map(z => z._id)));
    }, [user]);

    const handleCheckboxChange = (zoneId) => {
        setAssignedZones(prev => {
            const newSet = new Set(prev);
            newSet.has(zoneId) ? newSet.delete(zoneId) : newSet.add(zoneId);
            return newSet;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(user._id, Array.from(assignedZones));
    };

    return (
        <form onSubmit={handleSubmit}>
            <p>Assigning zones for: <strong>{user.name}</strong> ({user.role})</p>
            <div className="form-group" style={{ maxHeight: '40vh', overflowY: 'auto', border: '1px solid var(--background-light)', padding: '1rem', borderRadius: '0.5rem' }}>
                {allZones.map(zone => (
                    <div key={zone._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input type="checkbox" id={`zone-${zone._id}`} checked={assignedZones.has(zone._id)} onChange={() => handleCheckboxChange(zone._id)} style={{ marginRight: '0.5rem' }} />
                        <label htmlFor={`zone-${zone._id}`}>{zone.name}</label>
                    </div>
                ))}
            </div>
            <button type="submit" className="submit-button">Update Assignments</button>
        </form>
    );
};


export default AssignZonesForm;