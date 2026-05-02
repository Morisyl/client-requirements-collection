const express = require('express');
const router = express.Router();

// Import Middleware
const { upload, verifyMagicBytes } = require('../middleware/validateUpload');
const verifyAdminToken = require('../middleware/auth');
const sanitize = require('../middleware/sanitize');

// Import Controller (You will build this next)
const documentsController = require('../controllers/documentsController');

// ==========================================
// 🛣️ ROUTES
// ==========================================

/**
 * POST /api/documents/upload
 * Handles standalone file uploads.
 * Flow:
 * 1. upload.array: Multer intercepts the files (assumes input name 'files').
 * 2. verifyMagicBytes: Confirms files are actually images/PDFs.
 * 3. documentsController: Uploads to Supabase Storage and saves metadata to DB.
 */
router.post('/upload',
    upload.array('files', 10),
    verifyMagicBytes,
    documentsController.uploadDocuments
);

/**
 * GET /api/documents/:id/download
 * Generates and returns a short-lived signed URL for a document.
 * Flow:
 * 1. sanitize: Cleans the ID parameter.
 * 2. documentsController: Validates the ID and fetches the signed URL from Supabase.
 */
router.get('/:id/download',
    sanitize,
    documentsController.getDownloadUrl
);

/**
 * DELETE /api/documents/:id
 * Admin-only route to completely wipe a file from Storage and its DB record.
 * Flow:
 * 1. verifyAdminToken: Rejects the request if a valid JWT is not present.
 * 2. sanitize: Cleans the ID parameter.
 * 3. documentsController: Executes the deletion on both Supabase Storage and the DB.
 */
router.delete('/:id',
    verifyAdminToken,
    sanitize,
    documentsController.deleteDocument
);

module.exports = router;