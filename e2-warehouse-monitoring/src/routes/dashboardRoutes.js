// src/routes/dashboardRoutes.js
const express = require('express');
const {
    getLatestReadings,
    getHistoricalData,
    getAggregateData
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply the protect and authorize middleware to all routes in this file
// All authenticated users (Operator, Manager, Admin) can access dashboard data.
router.use(protect, authorize('Operator', 'Manager', 'Admin'));

router.get('/latest', getLatestReadings);
router.get('/history/:sensorId', getHistoricalData);
router.get('/aggregates/:sensorId', getAggregateData);

module.exports = router;