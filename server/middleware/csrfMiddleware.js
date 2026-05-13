const csrf = require('csurf');
const cookieParser = require('cookie-parser');

/**
 * Configure la protection CSRF
 * Note: Nécessite cookie-parser activé
 */
const setupCSRF = (app) => {
    // 1. Cookie Parser est requis pour csurf
    app.use(cookieParser());

    // 2. Initialisation csurf (stocké dans un cookie pour les SPAs)
    const csrfProtection = csrf({
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        }
    });

    // 3. Endpoint pour récupérer le token CSRF (pour le frontend)
    app.get('/api/csrf-token', csrfProtection, (req, res) => {
        res.json({ csrfToken: req.csrfToken() });
    });

    // 4. On peut choisir d'appliquer csrfProtection globalement ou par route
    // Pour un ERP API, on l'applique généralement aux routes de mutation
    // app.use(csrfProtection); 
    
    console.log('🛡️ Protection CSRF configurée (Cookie-based)');
};

module.exports = setupCSRF;
