const { mimeFromMagicBytes } = require('../utils/fileTypeChecker');

/**
 * The definitive list of allowed MIME types for the application.
 */
const ALLOWED_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
];

/**
 * Checks if a given MIME type string is permitted based on the whitelist.
 * @param {string} mimeType - The MIME type declared by the upload request
 * @returns {boolean} - True if the MIME type is whitelisted
 */
const isAllowedMimeType = (mimeType) => {
    return ALLOWED_MIMES.includes(mimeType);
};

/**
 * Validates that the file's true binary signature matches what the user claims it is.
 * This prevents malicious users from renaming an .exe to .jpg to bypass filters.
 * * @param {Buffer} buffer - The raw binary buffer of the file in memory
 * @param {string} declaredMime - The MIME type the file claims to be
 * @returns {boolean} - True if the binary signature matches the declared MIME type
 */
const checkMagicBytes = (buffer, declaredMime) => {
    // 1. Detect the true MIME type from the raw binary data
    const trueMimeType = mimeFromMagicBytes(buffer);

    // 2. Compare the detected type to the declared type
    return trueMimeType === declaredMime;
};

module.exports = {
    ALLOWED_MIMES,
    isAllowedMimeType,
    checkMagicBytes
};