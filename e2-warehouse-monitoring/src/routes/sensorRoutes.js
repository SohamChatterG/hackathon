// src/routes/sensorRoutes.js
const express = require('express');
const {
    createSensor,
    getSensors,
    updateSensor,
    deleteSensor,
    getAssignedSensors,
} = require('../controllers/sensorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();


// /api/sensors/assigned: all roles (Operator, Manager, Admin)
router.get('/assigned', protect, authorize('Operator', 'Manager', 'Admin'), getAssignedSensors);

// All other /sensors endpoints: Admin/Manager only
router.use(protect, authorize('Admin', 'Manager'));

router.route('/')
    .post(createSensor)
    .get(getSensors);

router.route('/:id')
    .put(updateSensor)
    .delete(deleteSensor);

module.exports = router;