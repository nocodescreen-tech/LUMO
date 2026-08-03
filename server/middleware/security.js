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
    process.env.FRONTEND_URL,
    'https://lumo-frontend-production-1dba.up.railway.app',
].filter(Boolean);

const securityMiddleware = (app) => {
    // Set security HTTP headers — helmet avec CSP explicite + HSTS
    // (helmet() seul n'active PAS la CSP par défaut)
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                // styles inline nécessaires (style={{}} + styled-components)
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:", "https:"],
                connectSrc: ["'self'", "https:"],
                fontSrc: ["'self'", "data:", "https:"],
                frameAncestors: ["'self'"],
                upgradeInsecureRequests: [],
            },
        },
        strictTransportSecurity: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    }));

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
    
    // Route pour initialiser le CSRF (désactivé en production - cross-domain avec Railway)
    app.get('/api/csrf-token', (req, res) => {
        // En production (2 domaines Railway différents), le CSRF via cookie ne fonctionne pas.
        // L'auth JWT Bearer est suffisante. On retourne juste un succès.
        if (process.env.NODE_ENV === 'production') {
            return res.json({ success: true });
        }
        csrfProtection(req, res, () => {
            setCsrfCookie(req, res, () => res.json({ success: true }));
        });
    });

    // Application du CSRF sur les autres routes (dev uniquement)
    app.use((req, res, next) => {
        // Désactiver le CSRF en production (cross-domain) et pendant les tests
        if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
            return next();
        }

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

    // General API rate limiter
    const apiLimiter = rateLimit({
        windowMs: 10 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Trop de requêtes, veuillez réessayer dans 10 minutes.' },
    });
    app.use('/api', apiLimiter);

    // Strict auth limiter — login & forgot-password : 10 tentatives / 15 min / IP
    // (brute-force protection ; 100 était trop laxiste)
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
    });
    app.use('/api/v1/auth/login', authLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/v1/auth/forgot-password', authLimiter);
    app.use('/api/auth/forgot-password', authLimiter);

    // Registration limiter — 20 inscriptions / 15 min / IP (moins strict : cas d'usage légitime multiples)
    const registerLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Trop d\'inscriptions. Réessayez dans 15 minutes.' },
    });
    app.use('/api/v1/auth/register', registerLimiter);
    app.use('/api/auth/register', registerLimiter);
};

module.exports = securityMiddleware;
