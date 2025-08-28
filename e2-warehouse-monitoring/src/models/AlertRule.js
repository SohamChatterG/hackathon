// src/models/AlertRule.js
const mongoose = require('mongoose');

const alertRuleSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    zone: { type: mongoose.Schema.ObjectId, ref: 'Zone' },
    field: { type: String, enum: ['temperature', 'humidity'], required: true },
    minThreshold: { type: Number, required: true },
    maxThreshold: { type: Number, required: true },
    unit: { type: String, enum: ['C', '%'], required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    isEnabled: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('AlertRule', alertRuleSchema);