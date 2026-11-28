const Newsletter = require('../models/Newsletter');
const GlobalSetting = require('../models/GlobalSetting');
const { sendEmail, getNewsletterWelcomeTemplate } = require('../utils/emailService');

exports.subscribe = async (req, res, next) => {
    try {
        const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():'';
        if (!email||email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
            return res.status(400).json({ message: "L'email est requis" });
        }
        

        
        const [subscriber, created] = await Newsletter.findOrCreate({
            where: { email },
            defaults: { email }
        });

        if (created) {
            
            // Récupérer les personnalisations du SuperAdmin
            const [customTitle, customBody, customLogo] = await Promise.all([
                GlobalSetting.findOne({ where: { key: 'newsletter_title' } }),
                GlobalSetting.findOne({ where: { key: 'newsletter_body' } }),
                GlobalSetting.findOne({ where: { key: 'newsletter_logo' } })
            ]);

            try {
                await sendEmail({
                    email: email,
                    subject: '🌿 Bienvenue dans la newsletter Lumo !',
                    html: getNewsletterWelcomeTemplate(customTitle?.value, customBody?.value, customLogo?.value)
                });
                
            } catch (mailError) {
                require('../utils/logger').warn('Envoi newsletter indisponible');
            }
        } else {
            
        }
        
        res.status(200).json({ message: "Souscription réussie" });
    } catch (error) {
        console.error("Erreur Newsletter:", error);
        next(error);
    }
};
