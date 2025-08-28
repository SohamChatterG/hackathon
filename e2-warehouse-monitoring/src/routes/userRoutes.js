// src/routes/userRoutes.js
const express = require('express');
const { getUsers, updateUserZones } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes in this file are protected and for Admins only
router.use(protect, authorize('Admin'));

router.route('/')
    .get(getUsers);

router.route('/:id/zones')
    .put(updateUserZones);

module.exports = router;