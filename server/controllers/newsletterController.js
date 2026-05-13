const Newsletter = require('../models/Newsletter');
const GlobalSetting = require('../models/GlobalSetting');
const { sendEmail, getNewsletterWelcomeTemplate } = require('../utils/emailService');

exports.subscribe = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "L'email est requis" });
        }
        
        console.log(`[NEWSLETTER] Inscription: ${email}`);
        
        const [subscriber, created] = await Newsletter.findOrCreate({
            where: { email },
            defaults: { email }
        });

        if (created) {
            console.log(`[NEWSLETTER] Nouvel abonné créé: ${email}. Envoi de l'email de bienvenue...`);
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
                console.log(`[NEWSLETTER] Email envoyé avec succès à ${email}`);
            } catch (mailError) {
                console.error(`[NEWSLETTER] ERR: Échec de l'envoi d'email à ${email}:`, mailError);
            }
        } else {
            console.log(`[NEWSLETTER] L'email ${email} existe déjà. Aucun email envoyé.`);
        }
        
        res.status(200).json({ message: "Souscription réussie" });
    } catch (error) {
        console.error("Erreur Newsletter:", error);
        next(error);
    }
};
