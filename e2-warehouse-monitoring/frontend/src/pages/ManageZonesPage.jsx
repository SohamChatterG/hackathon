import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ManagementLayout from '../components/admin/ManagementLayout';
import ZoneList from '../components/admin/ZoneList';
import ZoneCard from '../components/ZoneCard';
import ZoneDetailsModal from '../components/ZoneDetailsModal';
import ZoneForm from '../components/admin/ZoneForm';
import apiClient from '../api/apiClient';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const ManageZonesPage = () => {
    const [zones, setZones] = useState([]);
    const [editingZone, setEditingZone] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchZones = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get('/zones');
            setZones(response.data.data);
            setError('');
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
            } else {
                await apiClient.post('/zones', zoneData);
            }
            setEditingZone(null);
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

    return (
        <ManagementLayout title="Manage Zones">
            <div className="manage-zones-grid">
                <div className="card">
                    <h3 className="card-title">{editingZone ? 'Edit Zone' : 'Add New Zone'}</h3>
                    <ZoneForm onSubmit={handleFormSubmit} initialData={editingZone} onCancel={() => setEditingZone(null)} />
                </div>
                <div>
                    <h3 className="card-title">Existing Zones</h3>
                    {isLoading ? <div className="card"><p>Loading...</p></div> : error ? <div className="card"><p className="form-error">{error}</p></div> : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                            {zones.map(z => (
                                <ZoneCard key={z._id} zone={z} onOpen={(zone) => setSelectedZone(zone)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
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
