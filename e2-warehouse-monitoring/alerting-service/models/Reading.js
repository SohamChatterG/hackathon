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
        timestamp: {
            type: Date,
            required: true,
        },
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
        timeseries: {
            timeField: 'timestamp',
            metaField: 'sensorId',
            granularity: 'seconds',
        },
        versionKey: false,
    }
);

module.exports = mongoose.model('Reading', readingSchema);
