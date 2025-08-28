// FILE: frontend/src/pages/ManageSensorsPage.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ManagementLayout from '../components/admin/ManagementLayout';
import SensorList from '../components/admin/SensorList';
import SensorForm from '../components/admin/SensorForm';
import apiClient from '../api/apiClient';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const ManageSensorsPage = () => {
    const [sensors, setSensors] = useState([]);
    const [zones, setZones] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteSensor, setToDeleteSensor] = useState(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [sensorsRes, zonesRes] = await Promise.all([
                apiClient.get('/sensors'),
                apiClient.get('/zones')
            ]);
            setSensors(sensorsRes.data.data);
            setZones(zonesRes.data.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFormSubmit = async (formData) => {
        try {
            const dataToSubmit = {
                ...formData,
                minTemperature: formData.minTemperature === '' ? null : Number(formData.minTemperature),
                maxTemperature: formData.maxTemperature === '' ? null : Number(formData.maxTemperature),
                minHumidity: formData.minHumidity === '' ? null : Number(formData.minHumidity),
                maxHumidity: formData.maxHumidity === '' ? null : Number(formData.maxHumidity),
            };

            if (isEditing && selectedSensor) {
                await apiClient.put(`/sensors/${selectedSensor._id}`, dataToSubmit);
                toast.success('Sensor updated successfully!');
            } else {
                await apiClient.post('/sensors', dataToSubmit);
                toast.success('Sensor created successfully!');
            }
            await fetchData();
            setIsEditing(false);
            setSelectedSensor(null);
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save sensor.');
            return false;
        }
    };

    const handleSelectSensor = (sensor) => {
        setSelectedSensor(sensor);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedSensor(null);
    };

    const handleDeleteSensor = (sensorId) => {
        setToDeleteSensor(sensorId);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        const sensorId = toDeleteSensor;
        setToDeleteSensor(null);
        if (!sensorId) return;
        try {
            await apiClient.delete(`/sensors/${sensorId}`);
            toast.success('Sensor deleted successfully.');
            await fetchData();
            if (selectedSensor?._id === sensorId) {
                setSelectedSensor(null);
                setIsEditing(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete sensor.');
        }
    };

    return (
        <ManagementLayout title="Manage Sensors">
            <div className="manage-zones-grid">
                <div className="card">
                    <h3 className="card-title">Registered Sensors</h3>
                    {isLoading ? <p>Loading...</p> : error ? <p className="form-error">{error}</p> : (
                        <SensorList
                            sensors={sensors}
                            onSelectSensor={handleSelectSensor}
                            onDeleteSensor={handleDeleteSensor}
                            selectedSensorId={selectedSensor?._id}
                        />
                    )}
                </div>
                <div className="card">
                    <h3 className="card-title">{isEditing ? 'Edit Sensor' : 'Register New Sensor'}</h3>
                    {isLoading ? <p>Loading form...</p> : (
                        <SensorForm
                            onSubmit={handleFormSubmit}
                            initialData={isEditing ? selectedSensor : null}
                            zones={zones}
                            onCancel={handleCancelEdit}
                        />
                    )}
                </div>
            </div>
            <ConfirmDialog
                open={confirmOpen}
                title="Delete Sensor"
                message="Are you sure you want to delete this sensor?"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </ManagementLayout>
    );
};

export default ManageSensorsPage;