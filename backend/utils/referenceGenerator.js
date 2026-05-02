const crypto = require('crypto');
const { fetchRows } = require('../config/supabase');

/**
 * Generates a random, uppercase alphanumeric string.
 * Deliberately excludes ambiguous characters (O, 0, I, 1, L) to prevent client confusion.
 * * @param {number} length - The length of the string to generate
 * @returns {string}
 */
const generateRandomChars = (length = 4) => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let result = '';
    
    // Use crypto.randomBytes for true, cryptographically secure randomness
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
        // Map the random byte to an index in our character set
        result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
};

/**
 * Generates a human-readable, unique submission reference number.
 * Format: XTC-YYYY-XXXX (e.g., XTC-2026-A3F7)
 * Validates uniqueness against the database before returning.
 * * @returns {Promise<string>} - The guaranteed unique reference ID
 */
const generateReference = async () => {
    const prefix = 'XTC';
    const year = new Date().getFullYear();
    
    let isUnique = false;
    let referenceId = '';
    let attempts = 0;
    const maxAttempts = 5; // Failsafe to prevent an infinite loop in the worst-case scenario

    while (!isUnique && attempts < maxAttempts) {
        attempts++;
        
        // 1. Generate the candidate ID
        const randomPart = generateRandomChars(4);
        referenceId = `${prefix}-${year}-${randomPart}`;

        // 2. Check the database for collisions
        try {
            // We use { limit: 1 } to make the query as lightweight as possible
            const existingRecords = await fetchRows('submissions', { reference_id: referenceId }, { limit: 1 });
            
            // If the array is empty, the ID doesn't exist yet, so it's safe to use
            if (!existingRecords || existingRecords.length === 0) {
                isUnique = true;
            }
        } catch (error) {
            console.error(`[Reference Generator] Database check failed on attempt ${attempts}:`, error.message);
            throw new Error('Could not verify reference ID uniqueness due to a database error.');
        }
    }

    if (!isUnique) {
        // This is mathematically extremely rare, but acts as a strict safeguard
        const error = new Error('Failed to generate a completely unique reference ID after multiple attempts.');
        error.statusCode = 500;
        throw error;
    }

    return referenceId;
};

module.exports = {
    generateReference
};