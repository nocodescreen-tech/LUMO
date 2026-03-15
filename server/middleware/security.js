const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const cors = require('cors');

const securityMiddleware = (app) => {
    // Set security HTTP headers
    app.use(helmet());

    // Prevent XSS attacks
    app.use(xss());

    // Prevent http param pollution
    app.use(hpp());

    // Enable CORS
    app.use(cors());

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 10 * 60 * 1000, // 10 mins
        max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use('/api', limiter);
};

module.exports = securityMiddleware;
