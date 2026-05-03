const express = require('express');
const router = express.Router();

// Import Middleware
const verifyAdminToken = require('../middleware/auth');
const sanitize = require('../middleware/sanitize');

// Import Controller (You will build this next)
const adminController = require('../controllers/adminController');

// ==========================================
// 🔓 PUBLIC ROUTE (Authentication)
// ==========================================

/**
 * POST /api/admin/auth/login
 * Verifies admin credentials and issues a JWT session token.
 * This MUST be above the verifyAdminToken middleware.
 */
router.post('/auth/login', 
    sanitize, 
    adminController.login
);

// ==========================================
// 🧱 THE FIREWALL
// ==========================================
// Any route defined BELOW this line will require a valid Admin JWT token.
router.use(verifyAdminToken);

// ==========================================
// 🔴 PROTECTED ROUTES (Admin Dashboard Operations)
// ==========================================

/**
 * GET /api/admin/submissions
 * Retrieves a paginated, filterable list of all user submissions.
 * Query params can include: ?page=1&limit=20&status=pending&service_type=branding
 */
router.get('/submissions', 
    sanitize, 
    adminController.getAllSubmissions
);

/**
 * GET /api/admin/submissions/:id
 * Retrieves a single submission by its ID with full details.
 */
router.get('/submissions/:id', 
    sanitize, 
    adminController.getSubmissionById
);

/**
 * PATCH /api/admin/submissions/:id/status
 * Updates the lifecycle status of a submission (e.g., pending -> in_review -> completed).
 */
router.patch('/submissions/:id/status', 
    sanitize, 
    adminController.updateSubmissionStatus
);

/**
 * PATCH /api/admin/submissions/:id/notes
 * Saves or updates internal, private admin notes attached to a submission.
 */
router.patch('/submissions/:id/notes', 
    sanitize, 
    adminController.updateSubmissionNotes
);

/**
 * POST /api/admin/submissions/:id/tags
 * Attaches a categorization tag to a submission (e.g., "high-priority", "follow-up").
 */
router.post('/submissions/:id/tags', 
    sanitize, 
    adminController.addSubmissionTag
);

/**
 * DELETE /api/admin/submissions/:id/tags/:tag
 * Removes a specific tag from a submission.
 */
router.delete('/submissions/:id/tags/:tag', 
    sanitize, 
    adminController.removeSubmissionTag
);

module.exports = router;