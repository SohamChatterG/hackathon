// src/routes/alertRoutes.js
const express = require('express');
const { getActiveAlerts, acknowledgeAlert, triggerAlertNotification } = require('../controllers/alertController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const internalAuth = require('../middlewares/internalAuthMiddleware');

const router = express.Router();

// --- Internal Routes ---
router.post('/notify', internalAuth, triggerAlertNotification);

// --- User-Facing Routes ---
router.get('/', protect, getActiveAlerts);
router.put('/:id/acknowledge', protect, authorize('Manager', 'Admin'), acknowledgeAlert);

module.exports = router;