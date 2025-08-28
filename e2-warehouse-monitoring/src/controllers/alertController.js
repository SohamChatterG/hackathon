// src/controllers/alertController.js
const Alert = require('../models/Alert');

// @desc    Get all currently active (triggered or acknowledged) alerts
// @route   GET /api/alerts
// @access  Protected (All roles)
exports.getActiveAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({ status: { $in: ['triggered', 'acknowledged'] } })
            .sort({ triggeredAt: -1 })
            .populate('sensor', 'sensorId type')
            .populate('zone', 'name');

        res.status(200).json({ success: true, count: alerts.length, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Acknowledge an active alert
// @route   PUT /api/alerts/:id/acknowledge
// @access  Protected (Manager, Admin)
exports.acknowledgeAlert = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }

        if (alert.status !== 'triggered') {
            return res.status(400).json({ success: false, message: 'Alert is not in a triggerable state' });
        }

        alert.status = 'acknowledged';
        alert.acknowledgedBy = req.user.id;
        alert.acknowledgedAt = new Date();
        alert.history.push({ status: 'acknowledged', timestamp: new Date(), notes: `Acknowledged by ${req.user.name}` });

        await alert.save();

        const populatedAlert = await alert.populate(['sensor', 'zone']);
        req.io.emit('alert-update', populatedAlert);

        res.status(200).json({ success: true, data: populatedAlert });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Receive alert updates from the alerting-service
// @route   POST /api/alerts/notify
// @access  Internal
exports.triggerAlertNotification = (req, res) => {
    const updatedAlert = req.body;

    if (!updatedAlert) {
        return res.status(400).json({ message: 'Alert data is required.' });
    }

    req.io.emit('alert-update', updatedAlert);

    console.log('Broadcasted alert update via WebSocket for sensor:', updatedAlert.sensor.sensorId);
    res.status(200).json({ message: 'Notification received and broadcasted.' });
};
