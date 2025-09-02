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
            <p style={{ fontWeight: 500, fontSize: '1.1rem', marginBottom: '1rem' }}>
                Assigning zones for: <span style={{ fontWeight: 700 }}>{user.name}</span> <span style={{ fontWeight: 400 }}>({user.role})</span>
            </p>
            <div className="form-group" style={{ maxHeight: '40vh', overflowY: 'auto', border: '1px solid var(--background-light)', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
                {allZones.map(zone => (
                    <div key={zone._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem' }}>
                        <input
                            type="checkbox"
                            id={`zone-${zone._id}`}
                            checked={assignedZones.has(zone._id)}
                            onChange={() => handleCheckboxChange(zone._id)}
                            style={{
                                accentColor: '#0ea5b7',
                                width: '1.25rem',
                                height: '1.25rem',
                                borderRadius: '0.25rem',
                                marginRight: '0.5rem',
                                border: '2px solid #0ea5b7',
                                background: assignedZones.has(zone._id) ? '#0ea5b7' : '#fff',
                                transition: 'background 0.2s',
                            }}
                        />
                        <label htmlFor={`zone-${zone._id}`} style={{ fontWeight: assignedZones.has(zone._id) ? 600 : 400, color: assignedZones.has(zone._id) ? '#fff' : 'inherit' }}>{zone.name}</label>
                    </div>
                ))}
            </div>
            <button
                type="submit"
                className="submit-button"
                style={{
                    width: '100%',
                    background: '#0ea5b7',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    padding: '0.75rem 0',
                    borderRadius: '0.75rem',
                    marginTop: '1.5rem',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 8px rgba(14,165,183,0.08)'
                }}
            >
                Update Assignments
            </button>
        </form>
    );
};


export default AssignZonesForm;