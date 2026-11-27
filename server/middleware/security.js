const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

const {allowedOrigin}=require('./sessionOrigin');

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

            if(allowedOrigin(origin))return callback(null,true);
            const error=new Error('Origine non autorisée');error.statusCode=403;callback(error);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With', 'X-XSRF-TOKEN', 'x-xsrf-token', 'Cache-Control', 'Pragma', 'Expires', 'X-Lumo-Client'],
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
        // Désactiver le CSRF pendant les tests automatisés et en production (cross-domain)
        if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
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
    const otpLimiter=rateLimit({windowMs:15*60*1000,max:15,standardHeaders:true,legacyHeaders:false,message:{message:'Trop de tentatives. Réessayez plus tard.'}});
    for(const prefix of ['/api/auth','/api/v1/auth'])for(const route of ['/2fa/verify','/verify-email','/verify-reset-code','/reset-password','/resend-code'])app.use(prefix+route,otpLimiter);
};

module.exports = securityMiddleware;
