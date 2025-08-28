// src/routes/ingestionRoutes.js
const express = require('express');
const { ingestData } = require('../controllers/ingestionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// This route is protected and only accessible by Managers and Admins.
// They are the only ones authorized to run the simulation or manually push data.
router.route('/').post(protect, authorize('Manager', 'Admin'), ingestData);

module.exports = router;