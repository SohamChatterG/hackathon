import React, { useState, useEffect } from 'react';

const ZoneForm = ({ onSubmit, initialData, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || '');
        } else {
            setName('');
            setDescription('');
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await onSubmit({ name, description });
        if (success && !initialData) {
            setName('');
            setDescription('');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="zone-name" className="form-label">Zone Name</label>
                <input id="zone-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="form-input" />
            </div>
            <div className="form-group">
                <label htmlFor="zone-description" className="form-label">Description</label>
                <textarea id="zone-description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="form-input"></textarea>
            </div>
            <div className="form-actions">
                <button type="submit" className="submit-button">{initialData ? 'Update Zone' : 'Create Zone'}</button>
                {initialData && <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>}
            </div>
        </form>
    );
};
export default ZoneForm;
