import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const AlertsPanel = () => {
    const [alerts, setAlerts] = useState([]);
    const { user } = useAuth();

    const intervalRef = useRef(null);

    const fetchAlerts = async () => {
        try {
            const response = await apiClient.get('/alerts');
            setAlerts(response.data.data);
        } catch (error) {
            console.error('Failed to fetch alerts', error);
            toast.error('Failed to fetch alerts');
        }
    };

    useEffect(() => {
        // initial fetch
        fetchAlerts();

        // setup auto-refresh every 30s
        intervalRef.current = setInterval(fetchAlerts, 30000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const handleAcknowledge = async (alertId) => {
        try {
            await apiClient.put(`/alerts/${alertId}/acknowledge`);
            toast.success('Alert acknowledged');
            // refresh list after acknowledging
            fetchAlerts();
        } catch (error) {
            toast.error('Failed to acknowledge alert. You may not have permission.');
        }
    };

    const getSeverityColor = (severity) => {
        if (severity === 'critical' || severity === 'high') return 'var(--error-color)';
        if (severity === 'medium') return 'var(--warning-color)';
        return 'var(--info-color)';
    };

    const getLatestHistory = (alert) => {
        if (!alert.history || alert.history.length === 0) {
            return 'No history available.';
        }
        return alert.history[alert.history.length - 1].notes;
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="card-title">Active Alerts</h2>
                <div>
                    <button onClick={fetchAlerts} className="button-secondary" style={{ marginRight: '0.5rem' }}>Refresh</button>
                    <small style={{ color: 'var(--text-medium)' }}>Auto-refresh every 30s</small>
                </div>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {alerts.length === 0 ? <p>No active alerts.</p> : alerts.map(alert => (
                    <div key={alert._id} style={{ borderLeft: `5px solid ${getSeverityColor(alert.severity)}`, marginBottom: '1rem', padding: '1rem', backgroundColor: '#374151', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Sensor: {alert?.sensor?.sensorId ?? alert.sensorId ?? 'Unknown'}</h3>
                            <span style={{
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '1rem',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}>{alert.escalationLevel}</span>
                        </div>
                        <p style={{ margin: '0.5rem 0' }}>{getLatestHistory(alert)}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-medium)' }}>Zone: {alert?.zone?.name ?? alert.zone ?? 'Unknown'}</p>
                        {(user.role === 'Manager' || user.role === 'Admin') && (
                            <button onClick={() => handleAcknowledge(alert._id)} className="submit-button" style={{ padding: '0.4rem 0.8rem', marginTop: '0.5rem' }}>Acknowledge</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertsPanel;
