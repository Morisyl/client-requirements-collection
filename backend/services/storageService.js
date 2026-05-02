const crypto = require('crypto');
const path = require('path');
const supabaseAdmin = require('../config/db');

// Retrieve the bucket name from environment variables
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET;

if (!BUCKET_NAME) {
    console.error('🚨 CRITICAL ERROR: SUPABASE_STORAGE_BUCKET is missing in environment variables.');
}

/**
 * Sanitizes a filename to prevent path traversal and remove illegal characters.
 * @param {string} filename - The original filename
 * @returns {string} - The sanitized filename
 */
const sanitizeFilename = (filename) => {
    // 1. Extract the base name to strip out any directory paths (e.g., '../../etc/passwd' -> 'passwd')
    const baseName = path.basename(filename);
    
    // 2. Replace any character that is not alphanumeric, a dot, a hyphen, or an underscore
    let cleanName = baseName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    // 3. Ensure the filename isn't empty after sanitization
    if (!cleanName || cleanName === '_' || cleanName.startsWith('.')) {
        cleanName = `file_${crypto.randomUUID().substring(0, 8)}`;
    }
    
    return cleanName;
};

/**
 * Uploads a single file buffer to Supabase Storage.
 * @param {Buffer} buffer - The raw file buffer from memory
 * @param {string} mimeType - The file's MIME type
 * @param {string|number} submissionId - The ID or Reference ID to namespace the folder
 * @param {string} originalName - The original name of the uploaded file
 * @returns {Promise<string>} - The resulting storage path string
 */
const uploadFile = async (buffer, mimeType, submissionId, originalName) => {
    // 1. Sanitize the filename and extract the extension
    const cleanName = sanitizeFilename(originalName);
    const ext = path.extname(cleanName) || '';
    
    // 2. Generate a secure, collision-free UUID
    const uuid = crypto.randomUUID();
    
    // 3. Construct the namespaced storage path (e.g., submissions/XTC-2026-A3F7/uuid.pdf)
    const storagePath = `submissions/${submissionId}/${uuid}${ext}`;

    // 4. Upload to Supabase
    const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: false // Prevent accidental overwriting of files
        });

    if (error) {
        const err = new Error(`Storage upload failed: ${error.message}`);
        err.statusCode = 502; // Bad Gateway / Upstream error
        throw err;
    }

    return storagePath;
};

/**
 * Batch uploads multiple files for a single submission.
 * Required by submissionsController.js
 * @param {Array} files - The array of Multer file objects
 * @param {string|number} submissionId - The submission reference ID
 * @returns {Promise<Array>} - Array of metadata objects ready for database insertion
 */

/**
 * @param {string} submissionId - The submission reference ID (NOT a Promise!)
 */
const uploadMultiple = async (files, submissionId) => {
    if (typeof submissionId !== 'string') {
        throw new Error(`uploadMultiple expects string submissionId, got ${typeof submissionId}`);
    }
    
    const uploadedMetadata = [];

    if (!files || files.length === 0) return uploadedMetadata;

    for (const file of files) {
        // Upload the file to storage
        const storagePath = await uploadFile(file.buffer, file.mimetype, submissionId, file.originalname);
        
        // Push the metadata needed for the submission_documents table
        uploadedMetadata.push({
            file_name: sanitizeFilename(file.originalname),
            file_type: file.mimetype,
            storage_path: storagePath
        });
    }

    return uploadedMetadata;
};

/**
 * Generates a temporary, secure signed URL for private file access.
 * @param {string} storagePath - The exact path of the file in the bucket
 * @param {number} expiresInSeconds - Time until the URL expires (Default: 300s / 5 minutes)
 * @returns {Promise<string>} - The signed URL
 */
const generateSignedUrl = async (storagePath, expiresInSeconds = 300) => {
    const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
        const err = new Error(`Failed to generate signed URL: ${error.message}`);
        err.statusCode = 500;
        throw err;
    }
    
    return data.signedUrl;
};

/**
 * Deletes a file from the storage bucket.
 * Useful for admin deletion or rolling back a failed multi-step submission.
 * @param {string} storagePath - The path of the file to delete
 * @returns {Promise<boolean>} - True if successful
 */
const deleteFile = async (storagePath) => {
    const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

    if (error) {
        const err = new Error(`Failed to delete file from storage: ${error.message}`);
        err.statusCode = 500;
        throw err;
    }
    
    return true;
};

module.exports = {
    uploadFile,
    uploadMultiple,
    generateSignedUrl,
    deleteFile
};