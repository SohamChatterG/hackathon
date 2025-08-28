// src/controllers/zoneController.js
const Zone = require('../models/Zone');
const Sensor = require('../models/Sensor'); // We need this to check for dependencies before deleting

// @desc    Create a new zone
// @route   POST /api/zones
// @access  Protected (Admin)
exports.createZone = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Zone name is required.' });
        }
        const zone = await Zone.create({ name, description });
        res.status(201).json({ success: true, data: zone });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all zones
// @route   GET /api/zones
// @access  Protected (Admin, Manager)
exports.getZones = async (req, res) => {
    try {
        const zones = await Zone.find().sort({ name: 1 });
        res.status(200).json({ success: true, count: zones.length, data: zones });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get a single zone by ID
// @route   GET /api/zones/:id
// @access  Protected (Admin, Manager)
exports.getZoneById = async (req, res) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zone not found' });
        }
        res.status(200).json({ success: true, data: zone });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update a zone
// @route   PUT /api/zones/:id
// @access  Protected (Admin)
exports.updateZone = async (req, res) => {
    try {
        const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the modified document
            runValidators: true, // Run schema validators
        });
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zone not found' });
        }
        res.status(200).json({ success: true, data: zone });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a zone
// @route   DELETE /api/zones/:id
// @access  Protected (Admin)
exports.deleteZone = async (req, res) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zone not found' });
        }

        // Best Practice: Check if any sensors are currently assigned to this zone before deleting.
        const sensorInZone = await Sensor.findOne({ zone: req.params.id });
        if (sensorInZone) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete zone. It is currently assigned to one or more sensors.'
            });
        }

        await zone.deleteOne();
        res.status(200).json({ success: true, message: 'Zone deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};