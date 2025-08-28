import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const KPI = ({ label, value }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-medium)' }}>{label}</div>
    </div>
);

const LiveSensors = () => {
    const [sensorsMap, setSensorsMap] = useState({}); // keyed by sensorId
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // 1) fetch all registered sensors (to show a card for each)
                const sensorsRes = await apiClient.get('/sensors');
                const sensors = sensorsRes.data.data || [];

                // 2) fetch latest readings
                const latestRes = await apiClient.get('/dashboard/latest');
                const latest = latestRes.data.data || [];

                // map latest readings by sensorId
                const latestMap = latest.reduce((acc, r) => { acc[r.sensorId] = r; return acc; }, {});

                // merge: ensure every sensor has a card, use latest where available
                const merged = sensors.reduce((acc, s) => {
                    acc[s.sensorId] = {
                        sensorId: s.sensorId,
                        warehouseId: s.warehouseId || (s.zone && s.zone.name) || '—',
                        ...latestMap[s.sensorId],
                    };
                    return acc;
                }, {});

                setSensorsMap(merged);
            } catch (error) {
                console.error('Failed to fetch sensors/dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // The "rectangles" you see in the screenshots are the sensor cards (left) and KPI/detail cards (right) —
    // each card is a styled <div> with a .card-like appearance showing sensor metadata and readings.
    const [expandedSensor, setExpandedSensor] = useState(null);
    const [historyMap, setHistoryMap] = useState({});
    const [aggMap, setAggMap] = useState({});
    const [metric, setMetric] = useState('temperature'); // 'temperature' or 'humidity' for the modal

    const loadAggregates = async (sensorId) => {
        try {
            const res = await apiClient.get(`/dashboard/aggregates/${sensorId}`);
            return res.data.data;
        } catch (err) {
            console.error('Failed to load aggregates for', sensorId, err);
            return null;
        }
    };

    const loadHistory = async (sensorId) => {
        try {
            const res = await apiClient.get(`/dashboard/history/${sensorId}`);
            return res.data.data || [];
        } catch (err) {
            console.error('Failed to load history for', sensorId, err);
            return [];
        }
    };

    if (loading) return <div className="card"><h2 className="card-title">Live Sensor Status</h2><p>Loading...</p></div>;

    const sensors = Object.values(sensorsMap);

    return (
        <div className="card">
            <h2 className="card-title">Live Sensor Status</h2>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <KPI label="Sensors" value={sensors.length} />
                <KPI label="With Data" value={sensors.filter(s => s.temperature != null).length} />
                <KPI label="Avg Temp (shown)" value={
                    (() => {
                        const temps = sensors.filter(s => s.temperature != null).map(s => Number(s.temperature));
                        if (temps.length === 0) return '—';
                        const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
                        return avg.toFixed(1) + ' °C';
                    })()
                } />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {sensors.map(sensor => (
                    <div key={sensor.sensorId} style={{ padding: '1rem', backgroundColor: '#374151', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: '700' }}>{sensor.sensorId}</h3>
                            <small style={{ color: 'var(--text-medium)' }}>{sensor.warehouseId}</small>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{sensor.temperature != null ? Number(sensor.temperature).toFixed(1) + ' 0C' : '—'}</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{sensor.temperature != null ? Number(sensor.temperature).toFixed(1) + ' °C' : '—'}</div>
                            <div style={{ fontSize: '1.2rem', color: 'var(--text-medium)' }}>{sensor.humidity != null ? Number(sensor.humidity).toFixed(1) + ' %' : '—'}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', alignItems: 'center' }}>
                            <small style={{ color: '#6b7280' }}>{sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString() : 'No recent data'}</small>
                            <button
                                onClick={async () => {
                                    setMetric('temperature');
                                    setExpandedSensor(sensor.sensorId);
                                    // lazy-load aggregates and history
                                    const [agg, hist] = await Promise.all([loadAggregates(sensor.sensorId), loadHistory(sensor.sensorId)]);
                                    if (agg) setAggMap(m => ({ ...m, [sensor.sensorId]: agg }));
                                    if (hist) setHistoryMap(m => ({ ...m, [sensor.sensorId]: hist }));
                                }}
                                className="button-secondary"
                                style={{ padding: '0.25rem 0.6rem' }}
                            >
                                Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {expandedSensor && (
                (() => {
                    const sensorId = expandedSensor;
                    const history = (historyMap[sensorId] || []).slice().reverse(); // oldest -> newest
                    const agg = aggMap[sensorId];

                    const temps = history.map(h => Number(h.temperature)).filter(n => !Number.isNaN(n));
                    const hums = history.map(h => Number(h.humidity)).filter(n => !Number.isNaN(n));

                    const Sparkline = ({ values = [], color = '#60A5FA' }) => {
                        if (!values || values.length === 0) return <div style={{ color: 'var(--text-medium)' }}>No history</div>;
                        const width = 600, height = 96, padding = 6;
                        const max = Math.max(...values);
                        const min = Math.min(...values);
                        const range = max - min || 1;
                        const coords = values.map((v, i) => {
                            const x = padding + (i * (width - padding * 2) / (values.length - 1 || 1));
                            const y = padding + (1 - (v - min) / range) * (height - padding * 2);
                            return { x, y, v };
                        });

                        const linePoints = coords.map(p => `${p.x},${p.y}`).join(' ');
                        // polygon for area fill (baseline back to left)
                        const areaPoints = `${coords.map(p => `${p.x},${p.y}`).join(' ')} ${coords[coords.length - 1].x},${height - padding} ${coords[0].x},${height - padding}`;

                        return (
                            <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                                <defs>
                                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                                        <stop offset="100%" stopColor={color} stopOpacity="0.04" />
                                    </linearGradient>
                                </defs>
                                <polygon points={areaPoints} fill="url(#g1)" />
                                <polyline fill="none" stroke={color} strokeWidth="2.2" points={linePoints} strokeLinejoin="round" strokeLinecap="round" />
                            </svg>
                        );
                    };

                    return (
                        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.6)' }}>
                            <div style={{ width: '720px', maxWidth: '95%', background: '#0f1724', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0 }}>{sensorId} — Recent Activity</h3>
                                    <div>
                                        <button className="button-secondary" onClick={() => setExpandedSensor(null)} style={{ marginRight: '0.5rem' }}>Close</button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1rem', marginTop: '0.75rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className={metric === 'temperature' ? 'button small' : 'button-secondary small'} onClick={() => setMetric('temperature')}>Temperature</button>
                                                <button className={metric === 'humidity' ? 'button small' : 'button-secondary small'} onClick={() => setMetric('humidity')}>Humidity</button>
                                            </div>
                                        </div>

                                        <div style={{ height: 140 }}>
                                            <Sparkline values={(metric === 'temperature' ? temps : hums)} color={metric === 'temperature' ? '#60A5FA' : '#34D399'} />
                                        </div>
                                        <div style={{ marginTop: '0.5rem', color: 'var(--text-medium)' }}>Showing last {history.length} readings (most recent on right)</div>
                                    </div>
                                    <div style={{ background: '#071026', padding: '0.6rem', borderRadius: 6 }}>
                                        <h4 style={{ marginTop: 0 }}>KPIs</h4>
                                        {metric === 'temperature' ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                <div style={{ fontSize: '0.95rem' }}>Avg (°C)</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.avgTemp ? agg.avgTemp.toFixed(2) + ' °C' : '—') : (temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2) + ' °C' : '—')}</div>
                                                <div style={{ fontSize: '0.95rem' }}>Min (°C)</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.minTemp ?? '—') + ' °C' : (temps.length ? Math.min(...temps).toFixed(2) + ' °C' : '—')}</div>
                                                <div style={{ fontSize: '0.95rem' }}>Max (°C)</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.maxTemp ?? '—') + ' °C' : (temps.length ? Math.max(...temps).toFixed(2) + ' °C' : '—')}</div>
                                                <div style={{ fontSize: '0.95rem' }}>Count</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.count ?? 0) : temps.length}</div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                <div style={{ fontSize: '0.95rem' }}>Avg (%)</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.avgHumidity ? agg.avgHumidity.toFixed(2) + ' %' : '—') : (hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(2) + ' %' : '—')}</div>
                                                <div style={{ fontSize: '0.95rem' }}>Min (%)</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.minHumidity ?? '—') + ' %' : (hums.length ? Math.min(...hums).toFixed(2) + ' %' : '—')}</div>
                                                <div style={{ fontSize: '0.95rem' }}>Max (%)</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.maxHumidity ?? '—') + ' %' : (hums.length ? Math.max(...hums).toFixed(2) + ' %' : '—')}</div>
                                                <div style={{ fontSize: '0.95rem' }}>Count</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.count ?? 0) : hums.length}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()
            )}
        </div>
    );
};

export default LiveSensors;

