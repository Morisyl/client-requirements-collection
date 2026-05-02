const express = require('express');
const router = express.Router();

// Import Middleware
const verifyAdminToken = require('../middleware/auth');
const sanitize = require('../middleware/sanitize');

// Import Controller (You will build this next)
const servicesController = require('../controllers/servicesController');

// ==========================================
// 🟢 PUBLIC ROUTES
// ==========================================

/**
 * GET /api/services
 * Retrieves all currently active services and their dynamic field schemas.
 * Used by the frontend to render the correct form fields based on the user's selection.
 */
router.get('/', 
    servicesController.getActiveServices
);

// ==========================================
// 🔴 PROTECTED ROUTES (Admin Only)
// ==========================================

/**
 * POST /api/services
 * Creates a new service definition, including the dynamic fields required from the user.
 * Flow:
 * 1. verifyAdminToken: Ensures the request is from an authenticated admin.
 * 2. sanitize: Cleans the JSON payload (service name, descriptions, field names).
 * 3. servicesController: Saves the new schema to the database.
 */
router.post('/', 
    verifyAdminToken, 
    sanitize, 
    servicesController.createService
);

/**
 * PUT /api/services/:id
 * Updates an existing service (e.g., changing its name, description, or form fields).
 */
// ADD THIS — fetch a single service by ID (used by the edit page)
router.get('/:id',
    verifyAdminToken,
    servicesController.getServiceById
);



router.put('/:id', 
    verifyAdminToken, 
    sanitize, 
    servicesController.updateService
);

/**
 * DELETE /api/services/:id
 * Soft-deletes a service by setting `is_active = false`. 
 * This ensures that past submissions linked to this service don't break in the admin dashboard.
 */
router.delete('/:id', 
    verifyAdminToken, 
    sanitize, 
    servicesController.softDeleteService
);

module.exports = router;