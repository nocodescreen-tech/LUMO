const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

// Static origins always allowed (development + Capacitor WebView APK)
const baseAllowedOrigins = [
    'http://localhost',
    'https://localhost',
    'capacitor://localhost',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5180',
    'http://localhost:5181',
    'http://localhost:3000',
    'http://localhost:3001',
];

// Dynamically build the allowed-origins list at startup so that Railway
// env vars (injected at container start) are picked up correctly.
const buildAllowedOrigins = () => {
    const origins = [...baseAllowedOrigins];

    // Frontend URL explicitly configured (e.g. https://lumo-frontend-xxxx.up.railway.app)
    if (process.env.CLIENT_URL) {
        origins.push(process.env.CLIENT_URL);
    }

    // Backend's own public Railway domain – allows same-origin requests and
    // lets the backend call itself without CORS errors.
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        origins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }

    return origins;
};

const isRailwayOrigin = (origin) => {
    // Accept any Railway-hosted subdomain so preview / staging deployments
    // work automatically without updating CLIENT_URL each time.
    try {
        const { hostname } = new URL(origin);
        return hostname.endsWith('.up.railway.app');
    } catch {
        return false;
    }
};

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
            // Allow requests with no origin (curl, mobile apps, server-to-server)
            if (!origin) return callback(null, true);

            const allowedOrigins = buildAllowedOrigins();

            if (allowedOrigins.includes(origin)) return callback(null, true);

            // Allow any *.up.railway.app origin (covers preview deployments)
            if (isRailwayOrigin(origin)) return callback(null, true);

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
    
    // Route pour initialiser le CSRF explicitement si besoin
    app.get('/api/csrf-token', csrfProtection, setCsrfCookie, (req, res) => {
        res.json({ success: true });
    });

    // Application du CSRF sur les autres routes
    app.use((req, res, next) => {
        // Désactiver le CSRF pendant les tests automatisés
        if (process.env.NODE_ENV === 'test') {
            return next();
        }

        // Liste blanche pour les routes d'authentification (protégées par
        // leur propre mécanisme : refresh token HttpOnly, rate limits, OTP).
        // /auth/refresh notamment tourne au démarrage de l'app, AVANT que le
        // cookie XSRF-TOKEN soit établi — exiger CSRF ici casse la session.
        // NOTE : le path contient le préfixe /api (ex: /api/auth/login) donc
        // on utilise includes() et pas startsWith().
        const isAuthRoute = req.path.includes('/auth/');
                          
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

    // Strict auth limiter
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
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
