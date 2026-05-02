const supabase = require('./db');

/**
 * Normalises raw Supabase/Postgres errors into structured JavaScript Errors
 * with attached HTTP status codes for the Express error handler.
 * * @param {Object} error - The raw error object returned by Supabase
 * @returns {Error} - A normalised error object
 */
const normalizeSupabaseError = (error) => {
    if (!error) return null;

    const normalizedError = new Error(error.message || 'A database error occurred');
    normalizedError.details = error.details || error.hint || null;
    normalizedError.dbCode = error.code;

    // Map common Postgres error codes to appropriate HTTP status codes
    switch (error.code) {
        case '23505': // unique_violation
            normalizedError.statusCode = 409;
            normalizedError.message = 'A record with this information already exists.';
            break;
        case '23503': // foreign_key_violation
            normalizedError.statusCode = 400;
            normalizedError.message = 'Invalid reference. The related record does not exist.';
            break;
        case '23502': // not_null_violation
            normalizedError.statusCode = 400;
            normalizedError.message = 'Missing required fields in the database operation.';
            break;
        case 'PGRST116': // JSON object requested, multiple (or no) rows returned
            normalizedError.statusCode = 404;
            normalizedError.message = 'The requested resource could not be found.';
            break;
        case '42P01': // undefined_table
            normalizedError.statusCode = 500;
            normalizedError.message = 'Database configuration error: Table does not exist.';
            break;
        default:
            // Default to 500 Internal Server Error for unhandled database exceptions
            normalizedError.statusCode = 500;
    }

    return normalizedError;
};

/**
 * Inserts a single row or multiple rows into a specified table.
 * * @param {string} table - The name of the table
 * @param {Object|Array} data - The data object or array of objects to insert
 * @returns {Promise<Object|Array>} - The inserted data record(s)
 */
const insertRow = async (table, data) => {
    const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select(); // Return the inserted rows

    if (error) throw normalizeSupabaseError(error);
    
    // If inserting a single object, return a single object instead of an array
    return Array.isArray(data) ? result : result[0];
};

/**
 * Fetches rows from a specified table with optional filtering, sorting, and pagination.
 * * @param {string} table - The name of the table
 * @param {Object} match - Key-value pairs for exact matching (e.g., { status: 'active' })
 * @param {Object} options - Additional query options { select: '*', order: { column: 'created_at', ascending: false }, limit: 10 }
 * @returns {Promise<Array>} - Array of retrieved records
 */
const fetchRows = async (table, match = {}, options = {}) => {
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply exact match filters if provided
    if (Object.keys(match).length > 0) {
        query = query.match(match);
    }
    
    // Apply sorting if provided
    if (options.order && options.order.column) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }
    
    // Apply limit if provided
    if (options.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw normalizeSupabaseError(error);
    return data;
};

/**
 * Updates existing rows in a specified table based on matching criteria.
 * * @param {string} table - The name of the table
 * @param {Object} match - Key-value pairs to identify which rows to update (e.g., { id: 1 })
 * @param {Object} data - The new data to update the rows with
 * @returns {Promise<Array>} - The updated records
 */
const updateRow = async (table, match, data) => {
    if (!match || Object.keys(match).length === 0) {
        const err = new Error('Update operations require matching criteria to prevent bulk overwrites.');
        err.statusCode = 400;
        throw err;
    }

    const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .match(match)
        .select();

    if (error) throw normalizeSupabaseError(error);
    return result;
};

/**
 * Deletes rows from a specified table based on matching criteria.
 * * @param {string} table - The name of the table
 * @param {Object} match - Key-value pairs to identify which rows to delete (e.g., { id: 1 })
 * @returns {Promise<Array>} - The deleted records
 */
const deleteRow = async (table, match) => {
    if (!match || Object.keys(match).length === 0) {
        const err = new Error('Delete operations require matching criteria to prevent bulk deletions.');
        err.statusCode = 400;
        throw err;
    }

    const { data, error } = await supabase
        .from(table)
        .delete()
        .match(match)
        .select();

    if (error) throw normalizeSupabaseError(error);
    return data;
};

module.exports = {
    insertRow,
    fetchRows,
    updateRow,
    deleteRow,
    normalizeSupabaseError
};