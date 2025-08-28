// FILE: src/controllers/sensorController.js

const Sensor = require('../models/Sensor');

// @desc    Get all sensors
// @route   GET /api/sensors
// @access  Protected (Admin, Manager)
exports.getSensors = async (req, res) => {
    try {
        const sensors = await Sensor.find()
            .populate('zone', 'name')
            .sort({ sensorId: 1 });
        res.status(200).json({ success: true, count: sensors.length, data: sensors });
    } catch (error) {
        console.error('Error fetching sensors:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create a new sensor
// @route   POST /api/sensors
// @access  Protected (Admin, Manager)
exports.createSensor = async (req, res) => {
    try {
        const { sensorId, type, zone, minTemperature, maxTemperature, temperatureUnit, minHumidity, maxHumidity } = req.body;
        if (!sensorId || !type || !zone) {
            return res.status(400).json({ success: false, message: 'Sensor ID, type, and zone are required.' });
        }
        const sensor = await Sensor.create({
            sensorId,
            type,
            zone,
            minTemperature,
            maxTemperature,
            temperatureUnit,
            minHumidity,
            maxHumidity
        });
        res.status(201).json({ success: true, data: sensor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update a sensor's details and thresholds
// @route   PUT /api/sensors/:id
// @access  Protected (Admin, Manager)
exports.updateSensor = async (req, res) => {
    try {
        const sensor = await Sensor.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!sensor) {
            return res.status(404).json({ success: false, message: 'Sensor not found' });
        }
        res.status(200).json({ success: true, data: sensor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a sensor
// @route   DELETE /api/sensors/:id
// @access  Protected (Admin, Manager)
exports.deleteSensor = async (req, res) => {
    try {
        const sensor = await Sensor.findById(req.params.id);
        if (!sensor) {
            return res.status(404).json({ success: false, message: 'Sensor not found' });
        }
        await sensor.deleteOne();
        res.status(200).json({ success: true, message: 'Sensor deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};