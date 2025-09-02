// FILE: frontend/src/pages/ManageSensorsPage.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ManagementLayout from '../components/admin/ManagementLayout';
// ...existing code...
import SensorList from '../components/admin/SensorList';
import SensorForm from '../components/admin/SensorForm';
import apiClient from '../api/apiClient';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const ManageSensorsPage = () => {
    const [sensors, setSensors] = useState([]);
    const [zones, setZones] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
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

    useEffect(() => { fetchData(); }, []);


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
                setIsEditing(false);
                setSelectedSensor(null);
            } else {
                await apiClient.post('/sensors', dataToSubmit);
                toast.success('Sensor created successfully!');
                setShowCreateModal(false);
            }
            await fetchData();
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


    // Calculate sensor statistics
    const totalSensors = sensors.length;
    const activeSensors = sensors.filter(s => s.status === 'active').length;
    const criticalAlerts = sensors.filter(s => s.status === 'critical').length;
    const availableZones = zones.length;


    return (
        <ManagementLayout title="Manage Sensors">
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Left: Form and Registered Sensors */}
                <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button className="submit-button" style={{ background: '#0ea5b7', color: '#fff', fontWeight: 600, fontSize: '1rem', padding: '0.5rem 1.5rem', borderRadius: '0.5rem' }} onClick={() => setShowCreateModal(true)}>
                            + Register New Sensor
                        </button>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <h3 className="admin-card-title" style={{ fontSize: '1rem', margin: 0 }}>Registered Sensors</h3>
                            <div style={{ fontSize: '.7rem', letterSpacing: '.5px', color: 'var(--admin-text-soft)' }}>{sensors.length} TOTAL</div>
                        </div>
                        {isLoading ? (
                            <div className="admin-card"><p className="admin-card-sub" style={{ margin: 0 }}>Loading...</p></div>
                        ) : error ? (
                            <div className="admin-card"><p className="form-error" style={{ margin: 0 }}>{error}</p></div>
                        ) : (
                            <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ padding: '1rem 1rem .25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '.65rem', letterSpacing: '.5px', color: 'var(--admin-text-soft)', fontWeight: 600 }}>SENSOR LIST</div>
                                <div style={{ padding: '1rem' }}>
                                    <SensorList
                                        sensors={sensors}
                                        onSelectSensor={handleSelectSensor}
                                        onDeleteSensor={handleDeleteSensor}
                                        selectedSensorId={selectedSensor?._id}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Right: Sensor Statistics */}
                <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h3 className="admin-card-title" style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Sensor Statistics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#0ea5b7' }}>🖲️</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{totalSensors}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Total Sensors</div>
                                </div>
                            </div>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#22d3ee' }}>🟢</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{activeSensors}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Active Sensors</div>
                                </div>
                            </div>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#f87171' }}>⚠️</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{criticalAlerts}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Critical Alerts</div>
                                </div>
                            </div>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#fde68a' }}>📦</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{availableZones}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Available Zones</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Register Sensor Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.6)', zIndex: 2000 }}>
                    <div style={{ width: 420, background: '#0b1220', padding: 24, borderRadius: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 style={{ margin: 0 }}>Register New Sensor</h3>
                            <button className="button-secondary" onClick={() => setShowCreateModal(false)}>Close</button>
                        </div>
                        <SensorForm onSubmit={handleFormSubmit} zones={zones} onCancel={() => setShowCreateModal(false)} />
                    </div>
                </div>
            )}
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
