// src/controllers/userController.js
const User = require('../models/User');
const Zone = require('../models/Zone');

// @desc    Get all users
// @route   GET /api/users
// @access  Protected (Admin)
exports.getUsers = async (req, res) => {
    try {
        // We populate the 'zones' field to show the names of the zones a user is assigned to
        const users = await User.find().populate('zones', 'name').sort({ name: 1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update a user's zone assignments
// @route   PUT /api/users/:id/zones
// @access  Protected (Admin)
exports.updateUserZones = async (req, res) => {
    try {
        const { zones } = req.body; // Expect an array of Zone IDs

        if (!Array.isArray(zones)) {
            return res.status(400).json({ success: false, message: 'Zones must be an array of Zone IDs.' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Admins cannot have zones assigned, they have access to all.
        if (user.role === 'Admin') {
            return res.status(400).json({ success: false, message: 'Cannot assign zones to an Admin user.' });
        }

        user.zones = zones;
        await user.save();

        const updatedUser = await User.findById(req.params.id).populate('zones', 'name');

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};