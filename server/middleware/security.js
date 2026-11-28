const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const {allowedOrigin,protectBrowserMutation}=require('./sessionOrigin');

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
    
    // Browser writes require an explicit, non-simple header in all environments.
    // Bearer-authenticated CLI requests without browser context remain compatible.
    app.use('/api',protectBrowserMutation);
    // Legacy initialization endpoint (no token cookie is issued).
    app.get(['/api/csrf-token','/api/v1/csrf-token'],(_req,res)=>res.json({success:true,policy:'explicit-origin-header'}));

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
    const passwordLimiter=rateLimit({windowMs:15*60*1000,max:10,standardHeaders:true,legacyHeaders:false,skip:req=>!req.body?.motDePasse,message:{message:'Trop de tentatives de changement de mot de passe.'}});
    for(const prefix of ['/api/auth','/api/v1/auth'])app.use(prefix+'/profile',passwordLimiter);
    const otpLimiter=rateLimit({windowMs:15*60*1000,max:15,standardHeaders:true,legacyHeaders:false,message:{message:'Trop de tentatives. Réessayez plus tard.'}});
    for(const prefix of ['/api/auth','/api/v1/auth'])for(const route of ['/2fa/verify','/verify-email','/verify-reset-code','/reset-password','/resend-code'])app.use(prefix+route,otpLimiter);
};

module.exports = securityMiddleware;
