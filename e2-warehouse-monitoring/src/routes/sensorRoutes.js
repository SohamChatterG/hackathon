// src/routes/sensorRoutes.js
const express = require('express');
const {
    createSensor,
    getSensors,
    updateSensor,
    deleteSensor,
} = require('../controllers/sensorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, authorize('Admin', 'Manager'));

router.route('/')
    .post(createSensor)
    .get(getSensors);

router.route('/:id')
    .put(updateSensor)
    .delete(deleteSensor);

module.exports = router;