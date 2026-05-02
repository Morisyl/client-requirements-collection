/**
 * Extracts the first few bytes of a buffer as an uppercase hexadecimal string.
 * We extract up to 12 bytes (24 hex characters) to ensure we can identify formats like WebP 
 * which require checking bytes further down the header.
 * * @param {Buffer} buffer - The raw file buffer
 * @returns {string|null} - The hexadecimal string of the magic bytes
 */
const getMagicBytes = (buffer) => {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        return null;
    }

    // Safely read up to 12 bytes, or the max length of the buffer if it's unusually small
    const lengthToRead = Math.min(buffer.length, 12);
    return buffer.toString('hex', 0, lengthToRead).toUpperCase();
};

/**
 * Detects the true MIME type of a file buffer by matching its magic bytes 
 * against known file signatures for our allowed file types.
 * * @param {Buffer} buffer - The raw file buffer
 * @returns {string|null} - The detected MIME type, or null if unrecognized
 */
const mimeFromMagicBytes = (buffer) => {
    const signature = getMagicBytes(buffer);

    if (!signature) {
        return null;
    }

    // JPEG: Starts with FF D8 FF
    if (signature.startsWith('FFD8FF')) {
        return 'image/jpeg';
    }

    // PNG: Starts with 89 50 4E 47
    if (signature.startsWith('89504E47')) {
        return 'image/png';
    }

    // PDF: Starts with 25 50 44 46 (%PDF)
    if (signature.startsWith('25504446')) {
        return 'application/pdf';
    }

    // WebP: RIFF container format. 
    // Bytes 0-3 must spell 'RIFF' (hex: 52 49 46 46) -> first 8 hex chars
    // Bytes 8-11 must spell 'WEBP' (hex: 57 45 42 50) -> hex chars at index 16 to 24
    if (signature.startsWith('52494646') && signature.length >= 24) {
        const webpIdentifier = signature.substring(16, 24);
        if (webpIdentifier === '57454250') {
            return 'image/webp';
        }
    }

    // Unrecognized or unsupported file type
    return null;
};

module.exports = {
    getMagicBytes,
    mimeFromMagicBytes
};