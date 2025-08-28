import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { toast } from 'react-hot-toast';
import LiveSensors from './LiveSensors'; // for reuse of Sparkline if needed

const ZoneDetailsModal = ({ open, zone, onClose }) => {
    const [sensors, setSensors] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [metric, setMetric] = useState('temperature');
    const [zoneAgg, setZoneAgg] = useState(null);
    const [breachSummary, setBreachSummary] = useState(null);
    const [sensorStats, setSensorStats] = useState({});

    useEffect(() => {
        if (!open || !zone) return;
        const load = async () => {
            setLoading(true);
            try {
                const [sRes, uRes] = await Promise.all([
                    apiClient.get(`/sensors`),
                    apiClient.get(`/users`)
                ]);
                // filter sensors by zone id
                const allSensors = sRes.data.data || [];
                const zoneSensors = allSensors.filter(s => s.zone && s.zone._id === zone._id);
                setSensors(zoneSensors);

                const allUsers = uRes.data.data || [];
                const assigned = allUsers.filter(u => (u.zones || []).includes(zone._id));
                setUsers(assigned);
                // load zone aggregates and breach summary (server-side)
                try {
                    const [aggRes, breachRes] = await Promise.all([
                        apiClient.get(`/dashboard/zones/${zone._id}/aggregates`),
                        apiClient.get(`/dashboard/zones/${zone._id}/breach-summary`)
                    ]);
                    setZoneAgg(aggRes.data.data);
                    setBreachSummary(breachRes.data.data);
                } catch (err) {
                    // not fatal; we can still compute client-side
                    // console.warn('Zone aggregates/breach summary not available', err);
                }
            } catch (err) {
                toast.error('Failed to load zone details');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [open, zone]);

    // when sensors are set, fetch per-sensor history (small, limited) and compute stats
    useEffect(() => {
        if (!sensors || sensors.length === 0) return;
        let mounted = true;
        const loadStats = async () => {
            const stats = {};
            await Promise.all(sensors.map(async (s) => {
                try {
                    const res = await apiClient.get(`/dashboard/history/${s.sensorId}`);
                    const vals = (res.data.data || []).map(r => (metric === 'temperature' ? r.temperature : r.humidity)).reverse();
                    const minVal = vals.length ? Math.min(...vals) : null;
                    const maxVal = vals.length ? Math.max(...vals) : null;

                    // compute breaches: compare to sensor thresholds (use thresholds.* or fallback fields)
                    let total = 0, longest = 0, current = 0, lastBreach = null;
                    for (let i = 0; i < vals.length; i++) {
                        const v = vals[i];
                        const minT = metric === 'temperature' ? (s.minTemperature ?? s.thresholds?.temperature?.min) : (s.minHumidity ?? s.thresholds?.humidity?.min);
                        const maxT = metric === 'temperature' ? (s.maxTemperature ?? s.thresholds?.temperature?.max) : (s.maxHumidity ?? s.thresholds?.humidity?.max);
                        const isBreach = (minT != null && v < minT) || (maxT != null && v > maxT);
                        if (isBreach) {
                            total += 1;
                            current += 1;
                            if (!lastBreach) lastBreach = (res.data.data || [])[vals.length - 1 - i]?.timestamp;
                        } else {
                            if (current > longest) longest = current;
                            current = 0;
                        }
                    }
                    if (current > longest) longest = current;

                    stats[s._id] = {
                        values: vals,
                        minVal,
                        maxVal,
                        breaches: { total, longest, lastBreach }
                    };
                } catch (err) {
                    // ignore per-sensor errors
                }
            }));
            if (mounted) setSensorStats(stats);
        };
        loadStats();
        return () => { mounted = false; };
    }, [sensors, metric]);

    // small helpers for pie chart path
    const polarToCartesian = (cx, cy, r, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: cx + (r * Math.cos(angleInRadians)),
            y: cy + (r * Math.sin(angleInRadians))
        };
    };

    const describeArc = (cx, cy, r, startAngle, endAngle) => {
        const start = polarToCartesian(cx, cy, r, endAngle);
        const end = polarToCartesian(cx, cy, r, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        const d = [
            'M', cx, cy,
            'L', start.x, start.y,
            'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
            'Z'
        ].join(' ');
        return d;
    };

    if (!open) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.6)' }}>
            <div style={{ width: '900px', maxWidth: '96%', background: '#0f1724', padding: '1rem', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{zone.name} — Zone Details</h3>
                    <div>
                        <button className="button-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', marginTop: 12 }}>
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 8 }}>
                            <button className={metric === 'temperature' ? 'button small' : 'button-secondary small'} onClick={() => setMetric('temperature')}>Temperature</button>
                            <button className={metric === 'humidity' ? 'button small' : 'button-secondary small'} onClick={() => setMetric('humidity')}>Humidity</button>
                        </div>

                        <p style={{ color: 'var(--text-medium)' }}>{zone.description}</p>

                        <h4 style={{ marginTop: 12 }}>Sensors ({sensors.length})</h4>
                        {loading ? <p>Loading sensors...</p> : (
                            <div style={{ display: 'grid', gap: '0.6rem' }}>
                                {sensors.map(s => (
                                    <div key={s._id} className="card" style={{ padding: '0.6rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700 }}>{s.sensorId}</div>
                                                <div style={{ color: 'var(--text-medium)', fontSize: '0.9rem' }}>{s.description || ''}</div>
                                                {/* mini-sparkline */}
                                                {sensorStats[s._id] && sensorStats[s._id].values && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <svg width="160" height="36" viewBox="0 0 160 36">
                                                            <polyline
                                                                fill="none"
                                                                stroke="#60A5FA"
                                                                strokeWidth="2"
                                                                points={sensorStats[s._id].values.map((v, i) => {
                                                                    const x = (i / Math.max(1, sensorStats[s._id].values.length - 1)) * 156 + 2;
                                                                    const min = sensorStats[s._id].minVal ?? Math.min(...sensorStats[s._id].values);
                                                                    const max = sensorStats[s._id].maxVal ?? Math.max(...sensorStats[s._id].values);
                                                                    const y = 30 - ((v - min) / Math.max(1e-6, (max - min))) * 24;
                                                                    return `${x},${isFinite(y) ? y : 30}`;
                                                                }).join(' ')}
                                                            />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ width: 160, textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700 }}>
                                                    {metric === 'temperature'
                                                        ? `${s.minTemperature ?? s.thresholds?.temperature?.min ?? '—'} / ${s.maxTemperature ?? s.thresholds?.temperature?.max ?? '—'}`
                                                        : `${s.minHumidity ?? s.thresholds?.humidity?.min ?? '—'} / ${s.maxHumidity ?? s.thresholds?.humidity?.max ?? '—'}`}
                                                </div>
                                                <div style={{ color: 'var(--text-medium)', fontSize: '0.85rem' }}>Thresholds</div>
                                                {/* breach metrics */}
                                                {sensorStats[s._id] && sensorStats[s._id].breaches && (
                                                    <div style={{ marginTop: 8, fontSize: '0.85rem' }}>
                                                        <div>Total breaches: <strong>{sensorStats[s._id].breaches.total}</strong></div>
                                                        <div>Longest streak: <strong>{sensorStats[s._id].breaches.longest}</strong></div>
                                                        {sensorStats[s._id].breaches.lastBreach && (
                                                            <div>Last breach: <span style={{ color: 'var(--text-medium)' }}>{new Date(sensorStats[s._id].breaches.lastBreach).toLocaleString()}</span></div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <aside style={{ background: '#071026', padding: '0.75rem', borderRadius: 6 }}>
                        <h4 style={{ marginTop: 0 }}>Zone KPIs</h4>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div>
                                {breachSummary ? (
                                    (() => {
                                        const t = breachSummary.totalTempBreaches || 0;
                                        const h = breachSummary.totalHumBreaches || 0;
                                        const total = Math.max(1, (breachSummary.totalReadings || 0));
                                        const normal = Math.max(0, total - t - h);
                                        const segments = [
                                            { label: 'Temp breaches', value: t, color: '#F97316' },
                                            { label: 'Hum breaches', value: h, color: '#34D399' },
                                            { label: 'Normal', value: normal, color: '#60A5FA' }
                                        ];
                                        let start = 0;
                                        const cx = 48, cy = 48, r = 40;
                                        return (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <svg width="96" height="96" viewBox="0 0 96 96">
                                                    {segments.map((s, i) => {
                                                        const portion = s.value / (t + h + normal || 1);
                                                        const sweep = portion * 360;
                                                        const path = describeArc(cx, cy, r, start, start + sweep);
                                                        start += sweep;
                                                        return <path key={i} d={path} fill={s.color} fillOpacity={0.9} />;
                                                    })}
                                                </svg>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div style={{ color: 'var(--text-medium)' }}>No zone summary</div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: 'var(--text-medium)' }}>Managers / Operators</div>
                                <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                                    {users.length === 0 ? <li style={{ color: 'var(--text-medium)' }}>No users assigned</li> : users.map(u => (
                                        <li key={u._id} style={{ marginBottom: 6 }}>
                                            <div style={{ fontWeight: 700 }}>{u.name}</div>
                                            <div style={{ color: 'var(--text-medium)' }}>{u.role}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        {zoneAgg && (
                            <div style={{ marginTop: 10 }}>
                                <div style={{ fontSize: '0.95rem' }}>Avg Temp</div>
                                <div style={{ fontWeight: 700 }}>{zoneAgg.avgTemp ? zoneAgg.avgTemp.toFixed(2) + ' °C' : '—'}</div>
                                <div style={{ fontSize: '0.95rem', marginTop: 6 }}>Avg Humidity</div>
                                <div style={{ fontWeight: 700 }}>{zoneAgg.avgHumidity ? zoneAgg.avgHumidity.toFixed(2) + ' %' : '—'}</div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ZoneDetailsModal;
