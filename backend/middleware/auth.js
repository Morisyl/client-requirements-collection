const jwt = require('jsonwebtoken');

/**
 * Middleware to protect admin routes.
 * Expects an Authorization header in the format: Bearer <token>
 */
const verifyAdminToken = (req, res, next) => {
    // 1. Check if the Authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. Missing or invalid authorization header.'
        });
    }

    // 2. Extract the token
    const token = authHeader.split(' ')[1];

    // 3. Verify the token
    try {
        if (!process.env.ADMIN_JWT_SECRET) {
            console.error('🚨 ADMIN_JWT_SECRET is not defined in environment variables.');
            return res.status(500).json({
                status: 'error',
                message: 'Server configuration error.'
            });
        }

        // jwt.verify throws an error if the token is invalid or expired
        const decodedPayload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

        // 4. Attach the decoded payload to the request object for downstream use
        req.admin = decodedPayload;

        // 5. Proceed to the next middleware or route handler
        next();
        
    } catch (error) {
        // Distinguish between expired tokens and completely invalid ones for better client UX
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Your session has expired. Please log in again.'
            });
        }

        return res.status(401).json({
            status: 'error',
            message: 'Invalid token. Authentication failed.'
        });
    }
};

module.exports = verifyAdminToken;