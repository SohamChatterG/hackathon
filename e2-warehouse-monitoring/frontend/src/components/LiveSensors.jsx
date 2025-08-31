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
        <div className="card" style={{background:'linear-gradient(135deg, #101624 60%, #0a0e1a 100%)',boxShadow:'0 2px 32px 0 #000a1f66',borderRadius:'22px',padding:'2.2rem 2.2rem 1.7rem 2.2rem',maxWidth:'100vw'}}>
            <h2 className="card-title" style={{fontSize:'2rem',fontWeight:'bold',background:'linear-gradient(90deg,#60A5FA,#0ea5b7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:'1.7rem'}}>Live Sensor Status</h2>
            <div style={{ marginBottom: '2.2rem', display: 'flex', gap: '4.5rem', justifyContent:'center' }}>
                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'3.2rem',fontWeight:'bold',color:'#60A5FA',marginBottom:2}}>{sensors.length}</div>
                    <div style={{fontSize:'1.1rem',color:'var(--text-medium)'}}>Sensors</div>
                </div>
                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'3.2rem',fontWeight:'bold',color:'#22c55e',marginBottom:2}}>{sensors.filter(s => s.temperature != null).length}</div>
                    <div style={{fontSize:'1.1rem',color:'var(--text-medium)'}}>With Data</div>
                </div>
                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'3.2rem',fontWeight:'bold',color:'#fff',marginBottom:2}}>{(() => {
                        const temps = sensors.filter(s => s.temperature != null).map(s => Number(s.temperature));
                        if (temps.length === 0) return '—';
                        const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
                        return avg.toFixed(1);
                    })()}</div>
                    <div style={{fontSize:'1.1rem',color:'var(--text-medium)'}}>Avg Temp (shown) <span style={{fontSize:'1rem',color:'var(--text-dark)'}}>°C</span></div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.2rem', justifyContent:'center', alignItems:'stretch', width:'100%' }}>
                {sensors.map(sensor => (
                    <div key={sensor.sensorId} className="sensor-card-loveable" style={{ padding: '1.2rem 1.2rem 1rem 1.2rem', background: 'rgba(18,28,48,0.98)', borderRadius: '16px', boxShadow: '0 2px 18px 0 #000a1f44', transition:'box-shadow 0.22s, border-color 0.22s', border:'2px solid #22304a', position:'relative', cursor:'pointer', minHeight:'170px', display:'flex',flexDirection:'column',justifyContent:'space-between', maxWidth:'100%' }}
                        onMouseOver={e => e.currentTarget.style.boxShadow = '0 0 0 3px #60A5FA, 0 6px 32px 0 #60A5FA99'}
                        onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 18px 0 #000a1f44'}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'0.7rem' }}>
                            <h3 style={{ margin: 0, fontWeight: '700', fontSize:'1.25rem', color:'#60A5FA', letterSpacing:'0.5px' }}>{sensor.sensorId}</h3>
                            <span style={{ background:'#1e293b', color:'#60FAAD', borderRadius:'999px', padding:'0.22rem 1.1rem', fontSize:'1.05rem', fontWeight:600, letterSpacing:'0.2px', boxShadow:'0 0 0 2px #22304a' }}>{sensor.warehouseId}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns:'1fr 1fr', gap:'2.2rem', alignItems: 'center', margin:'1.2rem 0 0.7rem 0' }}>
                            <div style={{ textAlign:'center' }}>
                                <div style={{ fontSize:'2.7rem', fontWeight:'bold', color:'#fff', letterSpacing:'-1px' }}>{sensor.temperature != null ? Number(sensor.temperature).toFixed(1) : '—'}</div>
                                <div style={{ fontSize:'1.1rem', color:'#60A5FA', fontWeight:500 }}>°C</div>
                            </div>
                            <div style={{ textAlign:'center' }}>
                                <div style={{ fontSize:'2.7rem', fontWeight:'bold', color:'#fff', letterSpacing:'-1px' }}>{sensor.humidity != null ? Number(sensor.humidity).toFixed(1) : '—'}</div>
                                <div style={{ fontSize:'1.1rem', color:'#60A5FA', fontWeight:500 }}>%</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', alignItems: 'center', borderTop:'1.5px solid #22304a', paddingTop:'1rem' }}>
                            <small style={{ color: '#60A5FA', fontWeight:500 }}>{sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString() : 'No recent data'}</small>
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
                                style={{ padding: '0.55rem 1.5rem', fontWeight:600, fontSize:'1.1rem', borderRadius:'10px', background:'rgba(96,165,250,0.12)', color:'#60A5FA', border:'1.5px solid #60A5FA', boxShadow:'0 0 0 0 #60A5FA', transition:'background 0.18s, color 0.18s, border 0.18s' }}
                                onMouseOver={e => {e.currentTarget.style.background='#60A5FA';e.currentTarget.style.color='#fff';}}
                                onMouseOut={e => {e.currentTarget.style.background='rgba(96,165,250,0.12)';e.currentTarget.style.color='#60A5FA';}}
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
                        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.7)', zIndex: 1000 }}>
                            <div style={{ width: '1200px', maxWidth: '99vw', background: 'linear-gradient(135deg, #101624 60%, #0a0e1a 100%)', padding: '2.7rem 2.7rem 1.8rem 2.7rem', borderRadius: '1.5rem', boxShadow: '0 2px 32px 0 #000a1f66', border: '2.5px solid #22304a', minHeight: '520px', maxHeight: '96vh', display: 'flex', flexDirection: 'column', gap: '1.7rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, background: 'linear-gradient(90deg,#60A5FA,#0ea5b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{sensorId} — Recent Activity</h3>
                                    <button className="button-secondary" onClick={() => setExpandedSensor(null)} style={{ fontSize: '1.1rem', padding: '0.45rem 1.2rem', borderRadius: '8px', background: '#19223a', color: '#fff', border: '1.5px solid #60A5FA', fontWeight: 600 }}>Close</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 0.7fr', gap: '1.2rem', alignItems: 'start', height: '410px' }}>
                                    <div className="sensor-modal-section-hover" style={{ background: 'rgba(18,28,48,0.98)', borderRadius: '1.2rem', boxShadow: '0 2px 18px 0 #000a1f44', padding: '1.4rem 1.4rem 1rem 1.4rem', border: '2px solid #22304a', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', transition: 'box-shadow 0.22s, border-color 0.22s' }}>
                                        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.1rem' }}>
                                            <button className={metric === 'temperature' ? 'button' : 'button-secondary'} style={{ fontSize: '1.05rem', padding: '0.38rem 1.2rem', borderRadius: '8px', fontWeight: 600, background: metric === 'temperature' ? 'linear-gradient(90deg,#60A5FA,#0ea5b7)' : 'rgba(96,165,250,0.12)', color: metric === 'temperature' ? '#fff' : '#60A5FA', border: '1.5px solid #60A5FA', transition: 'all 0.18s' }} onClick={() => setMetric('temperature')}>Temperature</button>
                                            <button className={metric === 'humidity' ? 'button' : 'button-secondary'} style={{ fontSize: '1.05rem', padding: '0.38rem 1.2rem', borderRadius: '8px', fontWeight: 600, background: metric === 'humidity' ? 'linear-gradient(90deg,#60A5FA,#0ea5b7)' : 'rgba(96,165,250,0.12)', color: metric === 'humidity' ? '#fff' : '#60A5FA', border: '1.5px solid #60A5FA', transition: 'all 0.18s' }} onClick={() => setMetric('humidity')}>Humidity</button>
                                        </div>
                                        <div style={{ height: 'calc(100% - 60px)', minHeight: 180, background: 'rgba(255,255,255,0.01)', borderRadius: '1rem', boxShadow: '0 0 0 2px #22304a, 0 8px 40px 0 #60A5FA33', marginBottom: '0.5rem' }}>
                                            <Sparkline values={(metric === 'temperature' ? temps : hums)} color={metric === 'temperature' ? '#60A5FA' : '#34D399'} />
                                        </div>
                                        <div style={{ marginTop: '0.5rem', color: 'var(--text-medium)', fontSize: '1rem' }}>Showing last {history.length} readings (most recent on right)</div>
                                    </div>
                                    <div className="sensor-modal-section-hover" style={{ background: '#071026', padding: '0.7rem 0.7rem 0.7rem 0.7rem', borderRadius: '1.2rem', boxShadow: '0 2px 18px 0 #000a1f44', border: '2px solid #22304a', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.7rem', justifyContent: 'center', transition: 'box-shadow 0.22s, border-color 0.22s' }}>
                                        <h4 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 700, color: '#60A5FA', letterSpacing: '0.5px' }}>KPIs</h4>
                                        {metric === 'temperature' ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', fontSize: '1.05rem' }}>
                                                <div>Avg (°C)</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.avgTemp ? agg.avgTemp.toFixed(2) + ' °C' : '—') : (temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2) + ' °C' : '—')}</div>
                                                <div>Min (°C)</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.minTemp ?? '—') + ' °C' : (temps.length ? Math.min(...temps).toFixed(2) + ' °C' : '—')}</div>
                                                <div>Max (°C)</div>
                                                <div style={{ fontWeight: 700 }}>{agg ? (agg.maxTemp ?? '—') + ' °C' : (temps.length ? Math.max(...temps).toFixed(2) + ' °C' : '—')}</div>
                                                <div>Count</div>
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

