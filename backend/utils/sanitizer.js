const sanitizeHtml = require('sanitize-html');
const crypto = require('crypto');
const path = require('path');

/**
 * Strips HTML tags, trims whitespace, removes control characters, 
 * and enforces a maximum string length.
 * * @param {string} str - The raw string
 * @param {number} maxLength - Maximum allowed characters (default: 500)
 * @returns {string} - The cleaned string
 */
const sanitizeString = (str, maxLength = 500) => {
    if (typeof str !== 'string') return str;

    // 1. Strip all HTML/XML tags
    let clean = sanitizeHtml(str, {
        allowedTags: [], 
        allowedAttributes: {},
        disallowedTagsMode: 'discard'
    });

    // 2. Remove non-printable control characters (ASCII 0-31, 127-159)
    clean = clean.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // 3. Trim outer whitespace
    clean = clean.trim();

    // 4. Enforce length limits to prevent payload bloating
    if (clean.length > maxLength) {
        clean = clean.substring(0, maxLength);
    }

    return clean;
};

/**
 * Recursively cleans a dynamic object (like form_data).
 * - Applies sanitizeString to strings (with a larger allowance for textareas).
 * - Coerces valid numeric strings into actual Numbers.
 * - Cleans object keys to prevent NoSQL/JSON injection.
 * * @param {*} data - The input data structure
 * @returns {*} - The sanitized data structure
 */
const sanitizeFormData = (data) => {
    // Handle primitives
    if (data === null || typeof data === 'undefined') return null;
    
    if (typeof data === 'string') {
        const trimmed = data.trim();
        // Coerce numeric strings to actual numbers (e.g., "123" -> 123)
        // We ignore empty strings so they don't coerce to 0
        if (trimmed !== '' && !isNaN(Number(trimmed))) {
            return Number(trimmed);
        }
        // Use a larger max length (e.g., 5000) for dynamic form fields to accommodate textareas
        return sanitizeString(data, 5000); 
    }

    if (typeof data !== 'object') {
        return data; // Return booleans, numbers as-is
    }

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeFormData(item));
    }

    // Handle Objects
    const sanitizedObj = {};
    for (const [key, value] of Object.entries(data)) {
        // Strip unexpected keys (e.g., keys that are too long or contain weird characters)
        const cleanKey = sanitizeString(key, 100).replace(/[^a-zA-Z0-9_.-]/g, '_');
        
        if (cleanKey) {
            sanitizedObj[cleanKey] = sanitizeFormData(value);
        }
    }

    return sanitizedObj;
};

/**
 * Cleans a filename to be universally safe for file systems and URLs.
 * Strips path traversal characters, non-ASCII chars, limits length, 
 * and appends a UUID fragment to guarantee uniqueness.
 * * @param {string} name - The original filename
 * @returns {string} - The safe, collision-resistant filename
 */
const sanitizeFilename = (name) => {
    if (!name || typeof name !== 'string') {
        return `upload_${crypto.randomUUID()}`;
    }

    // 1. Extract the base name and extension securely
    const ext = path.extname(name).toLowerCase();
    const baseName = path.basename(name, ext);

    // 2. Strip path traversal characters and anything that isn't alphanumeric, dot, dash, or underscore
    let cleanBase = baseName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

    // 3. Remove leading periods (hidden files) or hyphens
    cleanBase = cleanBase.replace(/^[-.]+/, '');

    // 4. Limit the base name length (e.g., 50 chars) to prevent filesystem errors
    if (cleanBase.length > 50) {
        cleanBase = cleanBase.substring(0, 50);
    }
    
    // Fallback if the filename was completely stripped
    if (!cleanBase) cleanBase = 'file';

    // 5. Append a short UUID fragment (8 chars) to guarantee uniqueness and prevent overwriting
    const uuidFragment = crypto.randomUUID().split('-')[0];

    // Ensure the extension is reasonable (max 10 chars)
    const cleanExt = ext.substring(0, 10);

    return `${cleanBase}_${uuidFragment}${cleanExt}`;
};

module.exports = {
    sanitizeString,
    sanitizeFormData,
    cleanObject: sanitizeFormData, // Alias to support our previous controller implementation
    sanitizeFilename
};