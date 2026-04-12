// const express = require("express");
// const router = express.Router();

// const protect = require("../middleware/authMiddleware");
// const adminOnly = require("../middleware/adminMiddleware");

// const { getAdminAnalytics } = require("../controllers/adminController");

// router.get("/dashboard", protect, adminOnly, getAdminAnalytics);

// module.exports = router;


import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getAdminAnalytics, getAllFarmers } from '../controllers/adminController.js';

const router = express.Router();

router.get('/analytics', protect, adminOnly, getAdminAnalytics);
router.get('/farmers', protect, adminOnly, getAllFarmers);

export default router;