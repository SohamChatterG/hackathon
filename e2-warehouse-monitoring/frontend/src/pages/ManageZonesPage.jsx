import React, { useState, useEffect } from 'react';
import ManagementLayout from '../components/admin/ManagementLayout';
import ZoneList from '../components/admin/ZoneList';
import ZoneForm from '../components/admin/ZoneForm';
import apiClient from '../api/apiClient';

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
            alert(err.response?.data?.message || 'Failed to save zone.');
            return false;
        }
    };

    const handleDelete = async (zoneId) => {
        if (window.confirm('Are you sure you want to delete this zone?')) {
            try {
                await apiClient.delete(`/zones/${zoneId}`);
                fetchZones();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete zone.');
            }
        }
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
        </ManagementLayout>
    );
};
export default ManageZonesPage;
