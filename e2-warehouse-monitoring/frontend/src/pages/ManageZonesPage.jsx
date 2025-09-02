import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ManagementLayout from '../components/admin/ManagementLayout';
// ...existing code...
import ZoneCard from '../components/ZoneCard';
import ZoneDetailsModal from '../components/ZoneDetailsModal';
import ZoneForm from '../components/admin/ZoneForm';
import apiClient from '../api/apiClient';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const ManageZonesPage = () => {
    const [zones, setZones] = useState([]);
    const [editingZone, setEditingZone] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchZones = async () => {
        try {
            setIsLoading(true);
            // Fetch zones and sensors in parallel so we can compute counts client-side
            const [zonesRes, sensorsRes] = await Promise.all([
                apiClient.get('/zones'),
                apiClient.get('/sensors').catch(() => ({ data: { data: [] }}))
            ]);

            const rawZones = zonesRes.data.data || [];
            const sensors = sensorsRes.data.data || [];

            // Build count map by zone id
            const counts = {};
            for (const s of sensors) {
                // zone can be an id string or populated object { _id, name }
                const zId = typeof s.zone === 'object' && s.zone !== null ? s.zone._id : s.zone;
                if (zId) counts[zId] = (counts[zId] || 0) + 1;
            }

            const zonesWithCounts = rawZones.map(z => ({ ...z, sensorCount: counts[z._id] || 0 }));
            setZones(zonesWithCounts);
            setError('');

            if (selectedZone) {
                const updated = zonesWithCounts.find(z => z._id === selectedZone._id);
                if (updated) setSelectedZone(updated);
            }
        } catch (err) {
            setError('Failed to fetch zones.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchZones(); }, []);


    const handleFormSubmit = async (zoneData) => {
        try {
            if (editingZone) {
                await apiClient.put(`/zones/${editingZone._id}`, zoneData);
                setEditingZone(null);
            } else {
                await apiClient.post('/zones', zoneData);
                setShowCreateModal(false);
            }
            fetchZones();
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save zone.');
            return false;
        }
    };

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteZone, setToDeleteZone] = useState(null);

    const handleDelete = (zoneId) => {
        setToDeleteZone(zoneId);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        try {
            await apiClient.delete(`/zones/${toDeleteZone}`);
            fetchZones();
        } catch (err) {
            // small fallback
            console.error(err);
        }
        setToDeleteZone(null);
    };

    const [selectedZone, setSelectedZone] = useState(null);


    // Calculate zone statistics
    const totalZones = zones.length;
    const assignedSensors = zones.reduce((acc, z) => acc + (z.sensorCount || 0), 0);
    const emptyZones = zones.filter(z => !z.sensorCount).length;


    return (
        <ManagementLayout title="Manage Zones">
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Left: Form and Existing Zones */}
                <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button className="submit-button" style={{ background: '#0ea5b7', color: '#fff', fontWeight: 600, fontSize: '1rem', padding: '0.5rem 1.5rem', borderRadius: '0.5rem' }} onClick={() => setShowCreateModal(true)}>
                            + Add New Zone
                        </button>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <h3 className="admin-card-title" style={{ fontSize: '1rem', margin: 0 }}>Existing Zones</h3>
                            <div style={{ fontSize: '.7rem', letterSpacing: '.5px', color: 'var(--admin-text-soft)' }}>{zones.length} TOTAL</div>
                        </div>
                        {isLoading ? (
                            <div className="admin-card"><p className="admin-card-sub">Loading...</p></div>
                        ) : error ? (
                            <div className="admin-card"><p className="form-error" style={{ margin: 0 }}>{error}</p></div>
                        ) : (
                            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
                                {zones.map(z => (
                                    <ZoneCard key={z._id} zone={z} onOpen={(zone) => setSelectedZone(zone)} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {/* Right: Zone Statistics */}
                <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h3 className="admin-card-title" style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Zone Statistics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#0ea5b7' }}>📍</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{totalZones}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Total Zones</div>
                                </div>
                            </div>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#22d3ee' }}>🟢</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{assignedSensors}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Assigned Sensors</div>
                                </div>
                            </div>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#fbbf24' }}>🟡</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{emptyZones}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Empty Zones</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Create Zone Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.6)', zIndex: 2000 }}>
                    <div style={{ width: 420, background: '#0b1220', padding: 24, borderRadius: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 style={{ margin: 0 }}>Create Zone</h3>
                            <button className="button-secondary" onClick={() => setShowCreateModal(false)}>Close</button>
                        </div>
                        <ZoneForm onSubmit={handleFormSubmit} onCancel={() => setShowCreateModal(false)} />
                    </div>
                </div>
            )}
            <ConfirmDialog
                open={confirmOpen}
                title="Delete Zone"
                message="Are you sure you want to delete this zone?"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
            <ZoneDetailsModal open={!!selectedZone} zone={selectedZone} onClose={() => setSelectedZone(null)} />
        </ManagementLayout>
    );
};
export default ManageZonesPage;
