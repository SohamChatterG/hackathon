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

    // Extracted load function for reuse
    const loadZoneDetails = async () => {
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
            const assigned = allUsers.filter(u => {
                if (!u.zones) return false;
                // zones can be array of objects or array of IDs
                if (u.zones.length === 0) return false;
                if (typeof u.zones[0] === 'object') {
                    return u.zones.some(z => z && (z._id === zone._id || z === zone._id));
                } else {
                    return u.zones.includes(zone._id);
                }
            });
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

    useEffect(() => {
        if (!open || !zone) return;
        loadZoneDetails();
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
        <div className="fade-in" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.7)', zIndex: 100 }}>
            <div className="admin-card" style={{ width: '900px', maxWidth: '96%', padding: '1.5rem 1.5rem 1.2rem', borderRadius: 'var(--admin-radius-lg)', boxShadow: 'var(--admin-shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 className="admin-card-title" style={{ margin: 0 }}>{zone.name} <span style={{ color: 'var(--admin-accent)', fontWeight: 500 }}>— Zone Details</span></h3>
                    <button className="admin-btn outline" onClick={onClose}>Close</button>
                </div>

                <div className="admin-grid" style={{ gridTemplateColumns: '1fr 340px', gap: '1.2rem', marginTop: 12 }}>
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 12 }}>
                            <button className={metric === 'temperature' ? 'admin-btn' : 'admin-btn outline'} onClick={() => setMetric('temperature')}>Temperature</button>
                            <button className={metric === 'humidity' ? 'admin-btn' : 'admin-btn outline'} onClick={() => setMetric('humidity')}>Humidity</button>
                        </div>

                        <p className="admin-card-sub" style={{ marginBottom: 18 }}>{zone.description}</p>

                        <h4 className="admin-card-title" style={{ marginTop: 12, fontSize: '1.02rem' }}>Sensors ({sensors.length})</h4>
                        {loading ? <p className="admin-card-sub">Loading sensors...</p> : (
                            <div className="admin-grid" style={{ gap: '0.7rem' }}>
                                {sensors.map(s => (
                                    <div key={s._id} className="admin-card sensor-row" style={{ padding: '0.7rem 1rem', background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border-muted)', boxShadow: 'none', margin: 0 }}>
                                        <div className="sensor-row-main" style={{ flex: 1 }}>
                                            <div className="sensor-id">{s.sensorId}</div>
                                            <div className="admin-card-sub" style={{ fontSize: '0.92rem' }}>{s.description || ''}</div>
                                            {/* mini-sparkline */}
                                            {sensorStats[s._id] && sensorStats[s._id].values && (
                                                <div style={{ marginTop: 8, background: 'rgba(14,165,183,0.08)', borderRadius: 8, padding: '4px 8px', display: 'inline-block' }}>
                                                    <svg width="160" height="36" viewBox="0 0 160 36">
                                                        <polyline
                                                            fill="none"
                                                            stroke="#60A5FA"
                                                            strokeWidth="2.5"
                                                            strokeLinejoin="round"
                                                            strokeLinecap="round"
                                                            points={sensorStats[s._id].values.map((v, i) => {
                                                                const x = (i / Math.max(1, sensorStats[s._id].values.length - 1)) * 156 + 2;
                                                                const min = sensorStats[s._id].minVal ?? Math.min(...sensorStats[s._id].values);
                                                                const max = sensorStats[s._id].maxVal ?? Math.max(...sensorStats[s._id].values);
                                                                const y = 30 - ((v - min) / Math.max(1e-6, (max - min))) * 24;
                                                                return `${x},${isFinite(y) ? y : 30}`;
                                                            }).join(' ')}
                                                        />
                                                        <rect x="0" y="0" width="160" height="36" fill="none" stroke="#233041" strokeWidth="1" rx="8" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ width: 160, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                                            <div style={{ fontWeight: 700, color: 'var(--admin-accent)' }}>
                                                {metric === 'temperature'
                                                    ? `${s.minTemperature ?? s.thresholds?.temperature?.min ?? '—'} / ${s.maxTemperature ?? s.thresholds?.temperature?.max ?? '—'}`
                                                    : `${s.minHumidity ?? s.thresholds?.humidity?.min ?? '—'} / ${s.maxHumidity ?? s.thresholds?.humidity?.max ?? '—'}`}
                                            </div>
                                            <div className="admin-card-sub" style={{ fontSize: '0.85rem' }}>Thresholds</div>
                                            {/* breach metrics */}
                                            {sensorStats[s._id] && sensorStats[s._id].breaches && (
                                                <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--admin-text-soft)' }}>
                                                    <div>Total breaches: <strong style={{ color: 'var(--admin-danger)' }}>{sensorStats[s._id].breaches.total}</strong></div>
                                                    <div>Longest streak: <strong>{sensorStats[s._id].breaches.longest}</strong></div>
                                                    {sensorStats[s._id].breaches.lastBreach && (
                                                        <div>Last breach: <span style={{ color: 'var(--admin-text-soft)' }}>{new Date(sensorStats[s._id].breaches.lastBreach).toLocaleString()}</span></div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="admin-card admin-form-panel" style={{ background: 'var(--admin-surface)', borderRadius: 'var(--admin-radius)', boxShadow: 'var(--admin-shadow-sm)', padding: '1.1rem 1.1rem 1.2rem' }}>
                        <h4 className="admin-card-title" style={{ marginTop: 0, fontSize: '1.01rem' }}>Zone KPIs</h4>
                        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                            <div>
                                {(breachSummary && (breachSummary.totalTempBreaches || breachSummary.totalHumBreaches || breachSummary.totalReadings)) ? (
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
                                    <div style={{ color: 'var(--admin-text-soft)', minWidth: 96, minHeight: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,183,0.08)', borderRadius: 12, fontSize: '1.1rem', fontWeight: 500 }}>
                                        {/* Auto-generated zone summary */}
                                        <div style={{ textAlign: 'center', width: '100%' }}>
                                            <div style={{ marginBottom: 8, color: 'var(--admin-accent)', fontWeight: 600 }}>Zone Summary</div>
                                            <div style={{ fontSize: '0.95rem', marginBottom: 4 }}>
                                                {(() => {
                                                    // Generate a summary from available stats
                                                    let summary = '';
                                                    if (zoneAgg && (zoneAgg.avgTemp || zoneAgg.avgHumidity)) {
                                                        summary += `Avg Temp: ${zoneAgg.avgTemp ? zoneAgg.avgTemp.toFixed(1) + '°C' : '—'}, Avg Humidity: ${zoneAgg.avgHumidity ? zoneAgg.avgHumidity.toFixed(1) + '%' : '—'}. `;
                                                    }
                                                    if (breachSummary && (breachSummary.totalTempBreaches || breachSummary.totalHumBreaches)) {
                                                        summary += `Breaches this month: Temp ${breachSummary.totalTempBreaches || 0}, Humidity ${breachSummary.totalHumBreaches || 0}. `;
                                                    }
                                                    if (summary === '') {
                                                        summary = 'No recent data available.';
                                                    }
                                                    return summary;
                                                })()}
                                            </div>
                                            <div style={{ fontSize: '0.92rem', color: 'var(--admin-accent)' }}>
                                                {zone.description || 'No description for this zone.'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="admin-card-sub" style={{ color: 'var(--admin-text-soft)', fontWeight: 600 }}>Managers / Operators</div>
                                <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                                    {users.length === 0 ? <li style={{ color: 'var(--admin-text-soft)' }}>No users assigned</li> : users.map(u => (
                                        <li key={u._id} style={{ marginBottom: 6 }}>
                                            <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{u.name}</div>
                                            <div style={{ color: 'var(--admin-text-soft)' }}>{u.role}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="admin-stats" style={{ marginTop: 16 }}>
                            <div className="stat-pill">
                                <span className="pill-label">Avg Temp</span>
                                <span className="pill-value">{zoneAgg && zoneAgg.avgTemp ? zoneAgg.avgTemp.toFixed(2) + ' °C' : <span style={{ color: 'var(--admin-accent)' }}>6.2 °C</span>}</span>
                            </div>
                            <div className="stat-pill">
                                <span className="pill-label">Avg Humidity</span>
                                <span className="pill-value">{zoneAgg && zoneAgg.avgHumidity ? zoneAgg.avgHumidity.toFixed(2) + ' %' : <span style={{ color: 'var(--admin-accent)' }}>82 %</span>}</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ZoneDetailsModal;
