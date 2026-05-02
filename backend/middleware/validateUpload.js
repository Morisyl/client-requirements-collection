const multer = require('multer');
const { isAllowedMimeType, checkMagicBytes } = require('../validators/uploadValidator');

// ==========================================
// 1. MULTER CONFIGURATION
// ==========================================

// Parse max file size from env, default to 10MB
const MAX_FILE_SIZE_MB = process.env.MAX_FILE_SIZE_MB || 10;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Configure Multer to use RAM instead of the disk
const storage = multer.memoryStorage();

// Multer instance with strict constraints
const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_BYTES,
        files: 10 // Maximum 10 files per request
    },
    fileFilter: (req, file, cb) => {
        // Use the stateless validator we built
        if (isAllowedMimeType(file.mimetype)) {
            // Accept the file
            cb(null, true);
        } else {
            // Reject the file early with a 415 Unsupported Media Type
            const error = new Error(`Invalid file type: ${file.originalname}. Only JPEG, PNG, WEBP, and PDF are allowed.`);
            error.statusCode = 415;
            cb(error, false);
        }
    }
});

// ==========================================
// 2. MAGIC BYTE VERIFICATION
// ==========================================

/**
 * Middleware to inspect the actual binary signature (magic bytes) of the uploaded files.
 * This runs AFTER Multer has loaded the files into memory buffers.
 */
const verifyMagicBytes = (req, res, next) => {
    // Standardize handling whether it's a single file (req.file) or multiple (req.files)
    const files = req.files ? req.files : (req.file ? [req.file] : []);

    if (files.length === 0) {
        return next(); // No files uploaded, proceed to next middleware
    }

    for (const file of files) {
        // Pass the memory buffer and declared MIME type to our stateless validator
        const isValid = checkMagicBytes(file.buffer, file.mimetype);

        if (!isValid) {
            // If any file fails the deep inspection, reject the entire request
            const error = new Error(`Security rejection: ${file.originalname} has a spoofed extension or corrupted content.`);
            error.statusCode = 415;
            return next(error);
        }
    }

    // All files passed the deep inspection
    next();
};

// Export both the multer instance (for routing) and the verification middleware
module.exports = {
    upload,
    verifyMagicBytes
};