/**
 * Global Error Handling Middleware
 * Express recognizes this as an error handler because it has exactly 4 arguments.
 */
const errorHandler = (err, req, res, next) => {
    // 1. Determine the HTTP status code (default to 500 if unhandled)
    const statusCode = err.statusCode || 500;

    // 2. Construct the normalized error payload
    const errorResponse = {
        success: false,
        error: {
            // Use database code if available, otherwise generate a generic code
            code: err.dbCode || err.code || `HTTP_${statusCode}`,
            message: err.message || 'An unexpected internal server error occurred.',
            details: err.details || null
        }
    };

    // 3. Handle Logging and Production Security
    if (statusCode >= 500) {
        // Log critical server errors to the console (or your logging service)
        console.error(`\n[🚨 SERVER ERROR] ${req.method} ${req.originalUrl}`);
        console.error(err.stack || err);

        // Security: Mask 500 error details in production to prevent leaking system architecture
        if (process.env.NODE_ENV === 'production') {
            errorResponse.error.message = 'An unexpected internal server error occurred.';
            errorResponse.error.details = null;
        }
    } else {
        // For operational errors (400 Validation, 401/403 Auth, 404 Not Found)
        // We log a quieter warning instead of a full stack trace
        console.warn(`[⚠️ CLIENT ERROR] ${req.method} ${req.originalUrl} - ${statusCode}: ${err.message}`);
    }

    // 4. Send the standardized JSON response
    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;