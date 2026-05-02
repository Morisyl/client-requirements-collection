const supabaseAdmin = require('./db');

// Retrieve the bucket name from environment variables
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET;

// Validate configuration on startup
if (!BUCKET_NAME) {
    console.error('🚨 CRITICAL ERROR: SUPABASE_STORAGE_BUCKET is missing in environment variables.');
    process.exit(1);
}

/**
 * Generates a standard public URL for a file.
 * Note: This only works if your Supabase storage bucket is configured as 'Public'.
 * @param {string} path - The file path within the bucket (e.g., 'uploads/image.png')
 * @returns {string} - The direct public URL
 */
const getPublicUrl = (path) => {
    const { data } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

    return data.publicUrl;
};

/**
 * Generates a temporary, secure signed URL for private file access.
 * This is the recommended approach for viewing sensitive user uploads.
 * @param {string} path - The file path within the bucket
 * @param {number} expiresIn - Number of seconds until the URL expires (default: 3600s / 1 hour)
 * @returns {Promise<string>} - The signed URL
 */
const generateSignedUrl = async (path, expiresIn = 3600) => {
    const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, expiresIn);

    if (error) {
        const err = new Error(`Failed to generate signed URL: ${error.message}`);
        err.statusCode = 500;
        throw err;
    }
    
    return data.signedUrl;
};

/**
 * Deletes one or multiple files from the storage bucket.
 * Used for cleanup tasks or when an admin rejects/deletes a query.
 * @param {string|string[]} paths - A single file path or an array of paths to delete
 * @returns {Promise<Array>} - The deletion response details from Supabase
 */
const deleteFile = async (paths) => {
    // Ensure paths is an array for the Supabase remove() method
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    
    const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove(pathsArray);

    if (error) {
        const err = new Error(`Failed to delete file(s): ${error.message}`);
        err.statusCode = 500;
        throw err;
    }
    
    return data;
};

/**
 * Uploads a raw file buffer to the storage bucket.
 * @param {string} path - The destination path and filename in the bucket
 * @param {Buffer} fileBuffer - The binary buffer of the file
 * @param {string} contentType - The MIME type (e.g., 'image/jpeg', 'application/pdf')
 * @returns {Promise<Object>} - The upload result containing the path
 */
const uploadFile = async (path, fileBuffer, contentType) => {
     const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(path, fileBuffer, {
            contentType: contentType,
            upsert: false // Fails if a file with the exact same name already exists
        });
        
    if (error) {
        const err = new Error(`Storage upload failed: ${error.message}`);
        err.statusCode = 502; // Bad Gateway / Upstream error
        throw err;
    }
    
    return data;
};

module.exports = {
    getPublicUrl,
    generateSignedUrl,
    deleteFile,
    uploadFile
};