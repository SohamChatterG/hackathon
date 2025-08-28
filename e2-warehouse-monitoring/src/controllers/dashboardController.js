// src/controllers/dashboardController.js
const Reading = require('../models/Reading');

// @desc    Get the most recent reading for every unique sensor
// @route   GET /api/dashboard/latest
// @access  Protected (All roles)
exports.getLatestReadings = async (req, res) => {
    try {
        // This is a MongoDB Aggregation Pipeline. It's a powerful way to process data.
        const latestReadings = await Reading.aggregate([
            // 1. Sort all documents by timestamp in descending order
            { $sort: { timestamp: -1 } },
            // 2. Group them by sensorId, and take the FIRST document in each group
            {
                $group: {
                    _id: '$sensorId', // Group by the unique sensorId
                    doc: { $first: '$$ROOT' } // $$ROOT refers to the entire document
                }
            },
            // 3. Replace the root of the output with the document we found
            { $replaceRoot: { newRoot: '$doc' } }
        ]);

        res.status(200).json({
            success: true,
            count: latestReadings.length,
            data: latestReadings,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// @desc    Get historical data for a specific sensor
// @route   GET /api/dashboard/history/:sensorId
// @access  Protected (All roles)
exports.getHistoricalData = async (req, res) => {
    try {
        // You can add query params for time range, e.g., ?last=24h
        const readings = await Reading.find({ sensorId: req.params.sensorId })
            .sort({ timestamp: -1 }) // Get the most recent first
            .limit(100); // Limit to the last 100 readings for now

        res.status(200).json({
            success: true,
            count: readings.length,
            data: readings,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// @desc    Get aggregate data (avg, min, max) for a specific sensor over the last 24 hours
// @route   GET /api/dashboard/aggregates/:sensorId
// @access  Protected (All roles)
exports.getAggregateData = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const aggregates = await Reading.aggregate([
            // 1. Match documents for the specific sensor and time range
            {
                $match: {
                    sensorId: req.params.sensorId,
                    timestamp: { $gte: twentyFourHoursAgo }
                }
            },
            // 2. Group the matched documents and calculate aggregates
            {
                $group: {
                    _id: '$sensorId',
                    avgTemp: { $avg: '$temperature' },
                    minTemp: { $min: '$temperature' },
                    maxTemp: { $max: '$temperature' },
                    avgHumidity: { $avg: '$humidity' },
                    minHumidity: { $min: '$humidity' },
                    maxHumidity: { $max: '$humidity' },
                    count: { $sum: 1 }
                }
            }
        ]);

        if (aggregates.length === 0) {
            return res.status(404).json({ message: 'No data found for the specified sensor in the last 24 hours.' });
        }

        res.status(200).json({ success: true, data: aggregates[0] });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// @desc    Get aggregate data for a zone (averages across sensors in the zone) over the last 24 hours
// @route   GET /api/dashboard/zones/:zoneId/aggregates
// @access  Protected (All roles)
exports.getZoneAggregates = async (req, res) => {
    try {
        const zoneId = req.params.zoneId;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Join Readings with Sensors to filter by sensor.zone
        const aggregates = await Reading.aggregate([
            // lookup sensor metadata
            {
                $lookup: {
                    from: 'sensors',
                    localField: 'sensorId',
                    foreignField: 'sensorId',
                    as: 'sensor'
                }
            },
            { $unwind: '$sensor' },
            // match by zone id and time range
            {
                $match: {
                    'sensor.zone': require('mongoose').Types.ObjectId(zoneId),
                    timestamp: { $gte: twentyFourHoursAgo }
                }
            },
            // group across the zone
            {
                $group: {
                    _id: null,
                    avgTemp: { $avg: '$temperature' },
                    minTemp: { $min: '$temperature' },
                    maxTemp: { $max: '$temperature' },
                    avgHumidity: { $avg: '$humidity' },
                    minHumidity: { $min: '$humidity' },
                    maxHumidity: { $max: '$humidity' },
                    count: { $sum: 1 }
                }
            }
        ]);

        if (!aggregates || aggregates.length === 0) {
            return res.status(404).json({ message: 'No readings found for this zone in the last 24 hours.' });
        }

        res.status(200).json({ success: true, data: aggregates[0] });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// @desc    Get a simple breach-summary for a zone over the last 24 hours
// @route   GET /api/dashboard/zones/:zoneId/breach-summary
// @access  Protected (All roles)
exports.getZoneBreachSummary = async (req, res) => {
    try {
        const zoneId = req.params.zoneId;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // We will count readings that fall outside their sensor thresholds
        const pipeline = [
            { $lookup: { from: 'sensors', localField: 'sensorId', foreignField: 'sensorId', as: 'sensor' } },
            { $unwind: '$sensor' },
            { $match: { 'sensor.zone': require('mongoose').Types.ObjectId(zoneId), timestamp: { $gte: twentyFourHoursAgo } } },
            {
                $project: {
                    sensorId: 1,
                    temperature: 1,
                    humidity: 1,
                    isTempBreach: { $or: [{ $lt: ['$temperature', '$sensor.minTemperature'] }, { $gt: ['$temperature', '$sensor.maxTemperature'] }] },
                    isHumBreach: { $or: [{ $lt: ['$humidity', '$sensor.minHumidity'] }, { $gt: ['$humidity', '$sensor.maxHumidity'] }] }
                }
            },
            {
                $group: {
                    _id: '$sensorId',
                    tempBreaches: { $sum: { $cond: ['$isTempBreach', 1, 0] } },
                    humBreaches: { $sum: { $cond: ['$isHumBreach', 1, 0] } },
                    count: { $sum: 1 }
                }
            }
        ];

        const perSensor = await Reading.aggregate(pipeline);

        const zoneSummary = perSensor.reduce((acc, s) => {
            acc.totalTempBreaches += s.tempBreaches || 0;
            acc.totalHumBreaches += s.humBreaches || 0;
            acc.totalReadings += s.count || 0;
            acc.sensors += 1;
            return acc;
        }, { totalTempBreaches: 0, totalHumBreaches: 0, totalReadings: 0, sensors: 0 });

        res.status(200).json({ success: true, data: zoneSummary });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};