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