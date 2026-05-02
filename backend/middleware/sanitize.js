const sanitizeHtml = require('sanitize-html');

// 🛡️ Keys that should NEVER be mutated (passwords, tokens, etc.)
const EXCLUDED_KEYS = ['password', 'passwordConfirm', 'token', 'access_token'];

/**
 * Cleans a single string value.
 * 1. Strips all HTML/XML tags to prevent XSS.
 * 2. Trims leading and trailing whitespace.
 * 3. Strips non-printable control characters.
 * @param {string} str - The raw string input
 * @returns {string} - The sanitized string
 */
const cleanString = (str) => {
    let clean = sanitizeHtml(str, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: 'discard'
    });

    clean = clean.trim();
    clean = clean.replace(/[\x00-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]/g, '');

    return clean;
};

/**
 * Recursively traverses data structures to sanitize all strings.
 * @param {*} data - The input data 
 * @param {string|null} keyName - The current object key being processed
 * @returns {*} - The sanitized data structure
 */
const sanitizePayload = (data, keyName = null) => {
    // 🛑 If this field is on our exclusion list, return it EXACTLY as the user typed it
    if (keyName && EXCLUDED_KEYS.includes(keyName.toLowerCase())) {
        return data;
    }

    // Base case: If it's a string, clean it
    if (typeof data === 'string') {
        return cleanString(data);
    }
    
    // If it's an array, map over it recursively
    if (Array.isArray(data)) {
        return data.map(item => sanitizePayload(item, keyName));
    }
    
    // If it's a standard JSON object, iterate its keys
    if (data !== null && typeof data === 'object') {
        const sanitizedObject = {};
        for (const [key, value] of Object.entries(data)) {
            const cleanKey = cleanString(key);
            
            // Pass the cleanKey down so the next iteration knows if it should bypass sanitization
            sanitizedObject[cleanKey] = sanitizePayload(value, cleanKey);
        }
        return sanitizedObject;
    }

    // Return primitives (numbers, booleans, null) exactly as they are
    return data;
};

/**
 * Express Middleware to sanitize incoming request bodies, queries, and parameters.
 */
const sanitize = (req, res, next) => {
    if (req.body) req.body = sanitizePayload(req.body);
    if (req.query) req.query = sanitizePayload(req.query);
    if (req.params) req.params = sanitizePayload(req.params);
    
    next();
};

module.exports = sanitize;