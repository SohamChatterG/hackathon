import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import apiClient from '../api/apiClient';

const LiveSensors = () => {
    const [sensors, setSensors] = useState({});
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await apiClient.get('/dashboard/latest');
                const initialSensors = response.data.data.reduce((acc, sensor) => {
                    acc[sensor.sensorId] = sensor;
                    return acc;
                }, {});
                setSensors(initialSensors);
            } catch (error) {
                console.error("Failed to fetch initial sensor data", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const handleNewReading = (newReading) => {
            setSensors(prevSensors => ({
                ...prevSensors,
                [newReading.sensorId]: newReading,
            }));
        };
        socket.on('new-reading', handleNewReading);
        return () => socket.off('new-reading', handleNewReading);
    }, [socket]);

    return (
        <div className="card">
            <h2 className="card-title">Live Sensor Status</h2>
            <p style={{ marginBottom: '1rem', color: isConnected ? 'lightgreen' : 'lightcoral' }}>
                Socket Status: {isConnected ? 'Connected' : 'Disconnected'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {Object.values(sensors).map(sensor => (
                    <div key={sensor.sensorId} style={{ padding: '1rem', backgroundColor: '#374151', borderRadius: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 'bold' }}>{sensor.sensorId}</h3>
                        <p style={{ color: '#9ca3af' }}>Warehouse: {sensor.warehouseId || '—'}</p>
                        <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{sensor.temperature != null ? Number(sensor.temperature).toFixed(1) + ' \u00b0C' : '—'}</p>
                        <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{sensor.humidity != null ? Number(sensor.humidity).toFixed(1) + ' %' : '—'}</p>
                        <small style={{ color: '#6b7280' }}>
                            {sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString() : '—'}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveSensors;

