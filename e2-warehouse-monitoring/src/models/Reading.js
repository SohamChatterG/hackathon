// src/models/Reading.js
const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema(
    {
        temperature: {
            type: Number,
            required: true,
        },
        humidity: {
            type: Number,
            required: true,
        },
        // This is the most important field for a time series collection
        timestamp: {
            type: Date,
            required: true,
        },
        // --- Metadata Fields ---
        // These fields are for querying and identifying the data source
        sensorId: {
            type: String,
            required: true,
        },
        warehouseId: {
            type: String,
            required: true,
        },
    },
    {
        // This configures the collection as a Time Series collection
        timeseries: {
            timeField: 'timestamp',
            metaField: 'sensorId',
            granularity: 'seconds',
        },
        versionKey: false,
    }
);

module.exports = mongoose.model('Reading', readingSchema);