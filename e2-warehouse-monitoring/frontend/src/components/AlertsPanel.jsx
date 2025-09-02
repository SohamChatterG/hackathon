import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';


const AlertsPanel = () => {
    const [alerts, setAlerts] = useState([]);
    const [selectedAlerts, setSelectedAlerts] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    // Exit delete mode and clear selections
    const handleCancelDelete = () => {
        setDeleteMode(false);
        setSelectedAlerts([]);
        setSelectAll(false);
    };
    // Handle select all checkbox
    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedAlerts(filteredAlerts.map(a => a._id));
        } else {
            setSelectedAlerts([]);
        }
    };

    // Handle individual alert checkbox
    const handleSelectAlert = (alertId) => {
        setSelectedAlerts(prev =>
            prev.includes(alertId)
                ? prev.filter(id => id !== alertId)
                : [...prev, alertId]
        );
    };
    // Delete selected alerts
    const handleDeleteSelected = async () => {
        if (selectedAlerts.length === 0) return;
        try {
            await Promise.all(selectedAlerts.map(id => apiClient.delete(`/alerts/${id}`)));
            toast.success('Selected alerts deleted');
            setSelectedAlerts([]);
            setSelectAll(false);
            fetchAlerts();
        } catch (error) {
            toast.error('Failed to delete selected alerts');
        }
    };

    // Delete all alerts
    const handleDeleteAll = async () => {
        if (!window.confirm('Are you sure you want to delete ALL alerts?')) return;
        try {
            await apiClient.delete('/alerts'); // Assumes DELETE /alerts deletes all
            toast.success('All alerts deleted');
            setSelectedAlerts([]);
            setSelectAll(false);
            fetchAlerts();
        } catch (error) {
            toast.error('Failed to delete all alerts');
        }
    };
    const { user } = useAuth();
    const intervalRef = useRef(null);


    // For filtering by zone-sensor pair
    const [pairFilter, setPairFilter] = useState('all');
    // Build unique zone-sensor pairs
    const pairs = Array.from(new Set(alerts.map(a => {
        const zone = a.zone?.name ?? a.zone ?? 'UnknownZone';
        const sensor = a.sensor?.sensorId ?? a.sensorId ?? 'UnknownSensor';
        return `${zone} | ${sensor}`;
    })));

    const fetchAlerts = async () => {
        try {
            const response = await apiClient.get('/alerts');
            setAlerts(response.data.data);
        } catch (error) {
            console.error('Failed to fetch alerts', error);
            toast.error('Failed to fetch alerts');
        }
    };

    // Format timestamp
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleString();
    };

    // Filtered alerts by selected pair
    const filteredAlerts = pairFilter === 'all'
        ? alerts
        : alerts.filter(a => {
            const zone = a.zone?.name ?? a.zone ?? 'UnknownZone';
            const sensor = a.sensor?.sensorId ?? a.sensorId ?? 'UnknownSensor';
            return `${zone} | ${sensor}` === pairFilter;
        });

    // Helper: getSeverityColor
    function getSeverityColor(severity) {
        switch (severity) {
            case 'Critical': return '#ef4444';
            case 'Warning': return '#f59e42';
            case 'Info': return '#06b6d4';
            default: return '#64748b';
        }
    }

    // Helper: getLatestHistory
    function getLatestHistory(alert) {
        if (!alert.history || !alert.history.length) return alert.message || 'No details.';
        return alert.history[alert.history.length - 1]?.message || alert.message || 'No details.';
    }

    // Handler: acknowledge alert
    const handleAcknowledge = async (alertId) => {
        try {
            await apiClient.put(`/alerts/${alertId}/acknowledge`);
            toast.success('Alert acknowledged');
            fetchAlerts();
        } catch (error) {
            toast.error('Failed to acknowledge alert');
        }
    };

    // Auto-refresh every 30s
    useEffect(() => {
        fetchAlerts();
        intervalRef.current = setInterval(fetchAlerts, 30000);
        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <div className="admin-card admin-form-panel" style={{ minWidth: 340, background: 'var(--admin-surface)', borderRadius: 'var(--admin-radius)', boxShadow: 'var(--admin-shadow-sm)', padding: '1.2rem 1.2rem 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <h2 className="admin-card-title" style={{ color: 'var(--admin-accent)', fontSize: '1.25rem', margin: 0, letterSpacing: '.5px' }}>Active Alerts</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <button onClick={fetchAlerts} className="admin-btn outline" style={{ padding: '0.38rem 1.1rem', fontSize: '.92rem' }}>Refresh</button>
                    <span className="admin-card-sub" style={{ color: 'var(--admin-text-soft)', fontSize: '.85rem' }}>Auto-refresh every 30s</span>
                    {!deleteMode && (
                        <button onClick={() => setDeleteMode(true)} className="admin-btn danger" style={{ padding: '0.38rem 1.1rem', fontSize: '.92rem', marginLeft: 8 }}>Delete</button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.5rem' }}>
                <label className="admin-card-sub" style={{ color: 'var(--admin-text-soft)', fontWeight: 600, marginRight: 6 }}>Zone-Sensor:</label>
                <select value={pairFilter} onChange={e => setPairFilter(e.target.value)} style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-accent)', border: '1.5px solid var(--admin-border-muted)', borderRadius: 8, padding: '0.32rem 0.7rem', fontWeight: 600, fontSize: '.98rem' }}>
                    <option value="all">All</option>
                    {pairs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            {deleteMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.5rem' }}>
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} style={{ marginRight: 4 }} />
                    <span className="admin-card-sub" style={{ color: 'var(--admin-text-soft)', fontSize: '.95rem' }}>Select All</span>
                    <button onClick={handleDeleteSelected} className="admin-btn outline" style={{ padding: '0.38rem 1.1rem', fontSize: '.92rem', marginLeft: 8 }} disabled={selectedAlerts.length === 0}>Delete Selected</button>
                    <button onClick={handleDeleteAll} className="admin-btn danger" style={{ padding: '0.38rem 1.1rem', fontSize: '.92rem', marginLeft: 8 }}>Delete All</button>
                    <button onClick={handleCancelDelete} className="admin-btn" style={{ padding: '0.38rem 1.1rem', fontSize: '.92rem', marginLeft: 8 }}>Cancel</button>
                </div>
            )}

            <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredAlerts.length === 0 ? (
                    <div className="admin-card-sub" style={{ color: 'var(--admin-text-soft)', textAlign: 'center', marginTop: '2.5rem' }}>No active alerts.</div>
                ) : filteredAlerts.map(alert => (
                    <div key={alert._id} className="admin-card" style={{ background: 'linear-gradient(120deg,#162635 0%,#132431 75%)', border: `2.5px solid ${getSeverityColor(alert.severity)}`, borderLeftWidth: '6px', borderRadius: 'var(--admin-radius)', boxShadow: 'var(--admin-shadow-sm)', padding: '1.1rem 1.1rem 1.1rem 1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '.5rem', position: 'relative' }}>
                        {deleteMode && (
                            <input type="checkbox" checked={selectedAlerts.includes(alert._id)} onChange={() => handleSelectAlert(alert._id)} style={{ position: 'absolute', left: 8, top: 8, zIndex: 2 }} />
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.7rem', marginLeft: deleteMode ? 24 : 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '.1rem' }}>
                                <span className="admin-card-title" style={{ color: 'var(--admin-accent)', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '.3px' }}>Sensor: {alert?.sensor?.sensorId ?? alert.sensorId ?? 'Unknown'}</span>
                                <span className="admin-card-sub" style={{ color: 'var(--admin-text-soft)', fontSize: '.93rem' }}>Zone: {alert?.zone?.name ?? alert.zone ?? 'Unknown'}</span>
                            </div>
                            <span className="stat-pill" style={{ background: 'rgba(6,182,212,0.13)', color: 'var(--admin-accent)', fontWeight: 700, fontSize: '.92rem', border: '1.5px solid var(--admin-accent)', borderRadius: '999px', padding: '.22rem 1.1rem' }}>{alert.escalationLevel}</span>
                        </div>
                        <div className="admin-card-sub" style={{ color: 'var(--admin-text)', fontSize: '1.01rem', margin: '.2rem 0 .1rem 0', marginLeft: deleteMode ? 24 : 0 }}>{getLatestHistory(alert)}</div>
                        <div className="admin-card-sub" style={{ color: 'var(--admin-text-soft)', fontSize: '.93rem', marginLeft: deleteMode ? 24 : 0 }}>Time: {formatTime(alert.triggeredAt)}</div>
                        {(user.role === 'Manager' || user.role === 'Admin') && (
                            alert.status === 'acknowledged' ? (
                                <button
                                    className="admin-btn"
                                    style={{
                                        padding: '0.48rem 1.2rem',
                                        fontSize: '1.01rem',
                                        marginTop: '.4rem',
                                        alignSelf: 'flex-end',
                                        marginLeft: deleteMode ? 24 : 0,
                                        background: 'rgba(34,197,94,0.13)',
                                        color: '#22c55e',
                                        border: '1.5px solid #22c55e',
                                        cursor: 'default',
                                        fontWeight: 700
                                    }}
                                    disabled
                                >
                                    Acknowledged
                                </button>
                            ) : (
                                <button onClick={() => handleAcknowledge(alert._id)} className="admin-btn" style={{ padding: '0.48rem 1.2rem', fontSize: '1.01rem', marginTop: '.4rem', alignSelf: 'flex-end', marginLeft: deleteMode ? 24 : 0 }}>Acknowledge</button>
                            )
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AlertsPanel;
