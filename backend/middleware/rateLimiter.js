const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limiter for write operations (POST, PUT, DELETE)
const writeOperationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 write operations per windowMs
    message: {
        error: 'Too many write requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Even stricter rate limiter for authentication endpoints (if implemented)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 authentication attempts per windowMs
    message: {
        error: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Federated query limiter (more strict as these are expensive operations)
const federatedQueryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 federated queries per windowMs
    message: {
        error: 'Too many federated queries from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    writeOperationLimiter,
    authLimiter,
    federatedQueryLimiter
};
