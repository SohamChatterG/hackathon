// models/Alert.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    sensor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Sensor',
        required: true
    },
    zone: {
        type: mongoose.Schema.ObjectId,
        ref: 'Zone',
        required: true
    },
    status: {
        type: String,
        enum: ['triggered', 'acknowledged', 'resolved'],
        default: 'triggered',
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    escalationLevel: {
        type: String,
        enum: ['Operator', 'Manager', 'Admin'],
        default: 'Operator',
    },
    consecutiveBreaches: {
        type: Number,
        default: 0,
    },
    history: [{
        status: String,
        timestamp: Date,
        notes: String,
    }],
    acknowledgedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    acknowledgedAt: Date,
    resolvedAt: Date,
}, { timestamps: { createdAt: 'triggeredAt' } });

module.exports = mongoose.model('Alert', alertSchema);