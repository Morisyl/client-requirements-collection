const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Import Middleware
const { upload, verifyMagicBytes } = require('../middleware/validateUpload');
const sanitize = require('../middleware/sanitize');

// Import Controller (You will build this next)
const submissionsController = require('../controllers/submissionsController');

// ==========================================
// 🛡️ RATE LIMITING
// ==========================================
// Prevent spam/flooding: Max 5 submissions per IP per hour
const submissionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
    max: 5,                   // Limit each IP to 5 requests per window
    standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,     // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        error: {
            code: 'HTTP_429',
            message: 'You have reached the maximum number of requests allowed per hour. Please try again later.'
        }
    }
});

// ==========================================
// 🛣️ ROUTES
// ==========================================

/**
 * POST /api/submissions
 * Creates a new service request submission, handling multipart form data (text + files).
 * * Flow:
 * 1. submissionLimiter: Blocks IPs that spam the endpoint.
 * 2. upload.array: Multer parses the form, checks MIME types/sizes, loads files to RAM.
 * 3. verifyMagicBytes: Deep inspects file buffers for spoofed extensions.
 * 4. sanitize: Scrubs XSS/HTML from the newly populated req.body text fields.
 * 5. createSubmission: Controller logic to save to DB and upload to Storage.
 */
router.post('/',
    submissionLimiter,
    upload.array('documents', 10),// Match frontend field name
    verifyMagicBytes,
    sanitize,
    submissionsController.createSubmission
);

/**
 * GET /api/submissions/:id
 * Retrieves a single submission by its unique reference ID (e.g., for a success/tracking page).
 * * Flow:
 * 1. sanitize: Cleans the :id parameter to prevent injection before it hits the DB.
 * 2. getSubmission: Controller logic to fetch the record safely.
 */
router.get('/:id',
    sanitize,
    submissionsController.getSubmission
);

module.exports = router;