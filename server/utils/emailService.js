const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, html }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: process.env.FROM_EMAIL || '"Lumo" <noreply@lumo.app>',
        to: email,
        subject: subject,
        html: html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Message envoyé: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL] Erreur lors de l\'envoi:', error);
        throw error;
    }
};

const getVerificationTemplate = (code, name) => {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 14px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4); text-align: center; line-height: 48px; color: white; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; font-size: 26px; font-weight: 900; transform: rotate(15deg);">
                    <div style="transform: rotate(-15deg);">L</div>
                </div>
                <div style="font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif; font-size: 38px; font-weight: 900; color: #1e293b; letter-spacing: -0.05em; line-height: 1;">
                    Lumo
                </div>
            </div>
            <h1 style="color: #1e293b; margin-top: 24px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Vérification de votre compte</h1>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Bonjour <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Merci de rejoindre <strong>Lumo</strong>. Pour finaliser la création de votre compte professionnel, veuillez utiliser le code de vérification suivant :</p>
        
        <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; padding: 20px 40px; background-color: #ffffff; border: 2px dashed #6d28d9; border-radius: 16px; font-size: 36px; font-weight: 900; color: #6d28d9; letter-spacing: 0.2em; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                ${code}
            </div>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 12px;">Ce code expire dans 15 minutes.</p>
        </div>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6; border-top: 1px solid #e2e8f0; paddingTop: 24px; margin-top: 32px;">
            Si vous n'avez pas créé de compte Lumo, vous pouvez ignorer cet email en toute sécurité.
        </p>
        
        <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Lumo.app - La gestion intelligente pour votre commerce.
        </div>
    </div>
    `;
};

const getResetPasswordTemplate = (code, name) => {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; background-color: #fff7ed; border: 1px solid #fed7aa;">
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 14px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(234, 88, 12, 0.4); text-align: center; line-height: 48px; color: white; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; font-size: 26px; font-weight: 900; transform: rotate(15deg);">
                    <div style="transform: rotate(-15deg);">L</div>
                </div>
                <div style="font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif; font-size: 38px; font-weight: 900; color: #1e293b; letter-spacing: -0.05em; line-height: 1;">
                    Lumo
                </div>
            </div>
            <h1 style="color: #1e293b; margin-top: 24px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Récupération de mot de passe</h1>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Bonjour <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Nous avons reçu une demande de réinitialisation pour votre compte Lumo. Utilisez le code suivant pour sécuriser votre accès :</p>
        
        <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; padding: 20px 40px; background-color: #ffffff; border: 2px dashed #ea580c; border-radius: 16px; font-size: 36px; font-weight: 900; color: #ea580c; letter-spacing: 0.2em; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                ${code}
            </div>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 12px;">Ce code de sécurité expire dans 1 heure.</p>
        </div>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6; border-top: 1px solid #fed7aa; paddingTop: 24px; margin-top: 32px;">
            Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email. Votre mot de passe reste inchangé.
        </p>
        
        <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Lumo.app - Sécurité et Intelligence.
        </div>
    </div>
    `;
};

module.exports = {
    sendEmail,
    getVerificationTemplate,
    getResetPasswordTemplate
};
