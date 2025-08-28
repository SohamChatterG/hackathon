import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const SensorForm = ({ onSubmit, initialData, zones, onCancel }) => {
    const [formData, setFormData] = useState({
        sensorId: '',
        type: 'temperature',
        zone: '',
        minTemperature: '',
        maxTemperature: '',
        temperatureUnit: 'C',
        minHumidity: '',
        maxHumidity: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                sensorId: initialData.sensorId || '',
                type: initialData.type || 'temperature',
                zone: initialData.zone?._id || '',
                minTemperature: initialData.minTemperature ?? initialData.thresholds?.temperature?.min ?? '',
                maxTemperature: initialData.maxTemperature ?? initialData.thresholds?.temperature?.max ?? '',
                temperatureUnit: initialData.temperatureUnit || initialData.thresholds?.temperature?.unit || 'C',
                minHumidity: initialData.minHumidity ?? initialData.thresholds?.humidity?.min ?? '',
                maxHumidity: initialData.maxHumidity ?? initialData.thresholds?.humidity?.max ?? '',
            });
        } else {
            setFormData({
                sensorId: '',
                type: 'temperature',
                zone: zones.length > 0 ? zones[0]._id : '',
                minTemperature: '',
                maxTemperature: '',
                temperatureUnit: 'C',
                minHumidity: '',
                maxHumidity: '',
            });
        }
    }, [initialData, zones]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.zone) {
            toast.error('Please select a zone.');
            return;
        }
        const success = await onSubmit(formData);
        if (success && !initialData) {
            // Reset only if creating a new one
            setFormData({
                sensorId: '', type: 'temperature', zone: zones.length > 0 ? zones[0]._id : '',
                minTemperature: '', maxTemperature: '', temperatureUnit: 'C', minHumidity: '', maxHumidity: ''
            });
            toast.success('Sensor registered.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="sensor-form">
            <div className="form-group">
                <label htmlFor="sensorId" className="form-label">Sensor ID</label>
                <input id="sensorId" name="sensorId" type="text" value={formData.sensorId} onChange={handleChange} required className="form-input" />
            </div>
            <div className="form-group">
                <label htmlFor="type" className="form-label">Sensor Type</label>
                <select id="type" name="type" value={formData.type} onChange={handleChange} className="form-input">
                    <option value="temperature">Temperature</option>
                    <option value="humidity">Humidity</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="zone" className="form-label">Assign to Zone</label>
                <select id="zone" name="zone" value={formData.zone} onChange={handleChange} required className="form-input">
                    <option value="" disabled>-- Select a Zone --</option>
                    {zones.map(z => (
                        <option key={z._id} value={z._id}>{z.name}</option>
                    ))}
                </select>
            </div>

            <hr style={{ margin: '1.5rem 0' }} />
            <h4 className="card-title" style={{ fontSize: '1.25rem' }}>Set Safe Ranges</h4>

            <div className="form-group">
                <label className="form-label">Temperature Range</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input name="minTemperature" type="number" step="0.1" placeholder="Min" className="form-input"
                        value={formData.minTemperature} onChange={handleChange} />
                    <span>to</span>
                    <input name="maxTemperature" type="number" step="0.1" placeholder="Max" className="form-input"
                        value={formData.maxTemperature} onChange={handleChange} />
                    <select name="temperatureUnit" className="form-input" style={{ flexShrink: 1, width: '70px' }}
                        value={formData.temperatureUnit} onChange={handleChange}>
                        <option>C</option>
                        <option>F</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Humidity Range (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input name="minHumidity" type="number" step="0.1" placeholder="Min" className="form-input"
                        value={formData.minHumidity} onChange={handleChange} />
                    <span>to</span>
                    <input name="maxHumidity" type="number" step="0.1" placeholder="Max" className="form-input"
                        value={formData.maxHumidity} onChange={handleChange} />
                </div>
            </div>

            <div className="form-actions">
                <button type="submit" className="submit-button">{initialData ? 'Update Sensor' : 'Register Sensor'}</button>
                {initialData && <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>}
            </div>
        </form>
    );
};
export default SensorForm;
