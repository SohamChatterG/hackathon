const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
    sensorId: { type: String, required: true, unique: true },
    zone: { type: mongoose.Schema.ObjectId, ref: 'Zone', required: true },
    type: { type: String, enum: ['temperature', 'humidity'], required: true },

    // Thresholds grouped
    thresholds: {
        temperature: {
            min: { type: Number },
            max: { type: Number },
            unit: { type: String, enum: ['C', 'F'], default: 'C' }
        },
        humidity: {
            min: { type: Number },
            max: { type: Number },
        }
    },

    coordinates: {
        type: [Number],
        default: [0, 0],
    },

    // Extra fields
    minTemperature: { type: Number },
    maxTemperature: { type: Number },
    temperatureUnit: { type: String, enum: ['C', 'F'], default: 'C' },
    minHumidity: { type: Number },
    maxHumidity: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Sensor', sensorSchema);
