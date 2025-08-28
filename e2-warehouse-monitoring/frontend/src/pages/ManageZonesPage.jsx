import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ManagementLayout from '../components/admin/ManagementLayout';
import ZoneList from '../components/admin/ZoneList';
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

    return (
        <ManagementLayout title="Manage Zones">
            <div className="manage-zones-grid">
                <div className="card">
                    <h3 className="card-title">{editingZone ? 'Edit Zone' : 'Add New Zone'}</h3>
                    <ZoneForm onSubmit={handleFormSubmit} initialData={editingZone} onCancel={() => setEditingZone(null)} />
                </div>
                <div className="card">
                    <h3 className="card-title">Existing Zones</h3>
                    {isLoading ? <p>Loading...</p> : error ? <p className="form-error">{error}</p> : (
                        <ZoneList zones={zones} onEdit={setEditingZone} onDelete={handleDelete} />
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
        </ManagementLayout>
    );
};
export default ManageZonesPage;
