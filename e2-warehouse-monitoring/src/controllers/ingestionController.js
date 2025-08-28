// src/controllers/ingestionController.js
const Reading = require('../models/Reading');

// @desc    Ingest data from a sensor and broadcast via WebSocket
// @route   POST /api/ingest
// @access  Protected (Manager, Admin)
exports.ingestData = async (req, res) => {
    try {
        const { sensorId, temperature, humidity, warehouseId } = req.body;

        // Simple validation
        if (sensorId == null || temperature == null || humidity == null || warehouseId == null) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const reading = await Reading.create({
            sensorId,
            temperature,
            humidity,
            warehouseId,
            timestamp: new Date(), // Use server's timestamp for consistency
        });

        // --- REAL-TIME LOGIC ---
        // This line broadcasts the new reading to all connected dashboard clients.
        // The `req.io` object is attached by the middleware we set up in `src/index.js`.
        if (req.io) {
            req.io.emit('new-reading', reading);
        }

        // Respond to the sensor/simulator with a success message.
        // We no longer need to send the data back in the response body as it's sent via WebSocket.
        res.status(201).json({ message: 'Data ingested and broadcasted successfully' });

    } catch (error) {
        console.error('Ingestion Error:', error);
        res.status(500).json({ message: 'Server Error during data ingestion' });
    }
};