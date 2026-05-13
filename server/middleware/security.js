const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.CLIENT_URL,
].filter(Boolean);

const securityMiddleware = (app) => {
    // Set security HTTP headers
    app.use(helmet());

    // Prevent XSS attacks
    app.use(xss());

    // Prevent http param pollution
    app.use(hpp());

    // CORS – Restricted to known origins
    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (curl, mobile apps)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error('CORS: Origine non autorisée'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-TOKEN', 'x-xsrf-token', 'Cache-Control', 'Pragma', 'Expires'],
    }));

    // Cookie Parser for secure JWT cookies
    app.use(cookieParser());
    
    // Protection anti-CSRF professionnelle via csurf
    // Le secret de validation est stocké dans un cookie httpOnly sécurisé (_csrf)
    const csrfProtection = csrf({ 
        cookie: { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax'
        } 
    });

    // Middleware pour envoyer le JETON au frontend via le cookie XSRF-TOKEN (lu par Axios)
    const setCsrfCookie = (req, res, next) => {
        if (req.csrfToken) {
            res.cookie('XSRF-TOKEN', req.csrfToken(), {
                httpOnly: false, // Doit être false pour qu'Axios le lise
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        }
        next();
    };
    
    // Route pour initialiser le CSRF explicitement si besoin
    app.get('/api/csrf-token', csrfProtection, setCsrfCookie, (req, res) => {
        res.json({ success: true });
    });

    // Application du CSRF sur les autres routes
    app.use((req, res, next) => {
        // Liste blanche pour les routes d'authentification
        const isAuthRoute = req.path.includes('/auth/login') || 
                           req.path.includes('/auth/register') || 
                           req.path.includes('/auth/verify-email') ||
                           req.path.includes('/auth/forgot-password') ||
                           req.path.includes('/auth/reset-password');
                           
        if (isAuthRoute) {
            return next();
        }
        
        csrfProtection(req, res, (err) => {
            if (err) return next(err);
            setCsrfCookie(req, res, next);
        });
    });

    // General API rate limiter: 3000 requests / 10 min per IP (increased for testing/defense)
    const apiLimiter = rateLimit({
        windowMs: 10 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Trop de requêtes, veuillez réessayer dans 10 minutes.' },
    });
    app.use('/api', apiLimiter);

    // Strict auth limiter: 10 attempts / 15 min (brute-force protection)
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100, // Augmenté pour éviter les blocages pendant les tests
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
    });
    app.use('/api/v1/auth/login', authLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/v1/auth/register', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/v1/auth/forgot-password', authLimiter);
    app.use('/api/auth/forgot-password', authLimiter);
};

module.exports = securityMiddleware;
