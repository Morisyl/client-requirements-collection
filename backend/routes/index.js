const express = require('express');
const router = express.Router();

// Import Middleware
const verifyAdminToken = require('../middleware/auth');

// Import Sub-Routers
const submissionsRoutes = require('./submissions');
const documentsRoutes = require('./documents');
const servicesRoutes = require('./services');
const adminRoutes = require('./admin');

// ==========================================
// 🟢 PUBLIC ROUTES (No Authentication Required)
// ==========================================

// Handle incoming service requests and file uploads from the frontend
router.use('/submissions', submissionsRoutes);

// Handle fetching available services/tiers for the dynamic form
router.use('/services', servicesRoutes);

// (Optional) Handle public document retrieval if needed later
router.use('/documents', documentsRoutes);


// ==========================================
// 🔴 PROTECTED ROUTES (Admin Only)
// ==========================================

// All routes within /admin will first pass through the verifyAdminToken middleware
router.use('/admin', adminRoutes);


// ==========================================
// 🩺 HEALTH CHECK
// ==========================================

// A simple endpoint to verify the API is running
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running smoothly.',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;