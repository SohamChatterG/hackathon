// src/routes/zoneRoutes.js
const express = require('express');
const {
    createZone,
    getZones,
    getZoneById,
    updateZone,
    deleteZone,
} = require('../controllers/zoneController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply the 'protect' middleware to all routes below
router.use(protect);

// Define routes with specific role authorization
router.route('/')
    .post(authorize('Admin'), createZone)
    .get(authorize('Admin', 'Manager'), getZones);

router.route('/:id')
    .get(authorize('Admin', 'Manager'), getZoneById)
    .put(authorize('Admin'), updateZone)
    .delete(authorize('Admin'), deleteZone);

module.exports = router;