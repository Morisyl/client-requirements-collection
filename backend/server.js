// Load environment variables
require('dotenv').config();

// Core dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Internal modules
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

// 1. Global Uncaught Exception Handler (Synchronous errors)
// Must be at the very top to catch initialization errors
process.on('uncaughtException', (err) => {
    console.error('🚨 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
});

// 2. Initialize Express Application
const app = express();

// 3. Global Middleware Stack

// Set security HTTP headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // Configure strictly in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));

// Apply Rate Limiting to prevent brute-force and DDoS attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.'
    }
});
// Apply limiter to all requests (or specifically to /api)
app.use(limiter);

// Parse incoming JSON payloads (with size limit for security)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies (for standard form submissions)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Mount Routes
// All route logic is delegated to the routes index
app.use('/api', routes);

// Handle undefined routes (404)
app.use((req, res, next) => {
    const error = new Error(`Cannot find ${req.originalUrl} on this server.`);
    error.statusCode = 404;
    next(error);
});

// 5. Global Error Handling Middleware
// Catches operational errors passed via next()
app.use(errorHandler);

// 6. Start HTTP Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`✅ Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// 7. Global Unhandled Rejection Handler (Asynchronous errors)
// e.g., Uncaught failed database connections
process.on('unhandledRejection', (err) => {
    console.error('🚨 UNHANDLED REJECTION! Shutting down gracefully...');
    console.error(err.name, err.message);
    
    // Give the server time to finish pending requests before exiting
    server.close(() => {
        process.exit(1);
    });
});