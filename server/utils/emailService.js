const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, html, attachments }) => {
    // Nettoyage des variables (Railway ajoute parfois des guillemets littéraux)
    const smtpUser = (process.env.SMTP_USER || '').replace(/['"]/g, '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').replace(/['"]/g, '').replace(/\s/g, '');
    const smtpHost = (process.env.SMTP_HOST || 'smtp-relay.brevo.com').replace(/['"]/g, '').trim();
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;

    console.log(`[EMAIL] Tentative d'envoi vers: ${email} via ${smtpHost}:${smtpPort} (user: ${smtpUser})`);

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
        tls: {
            rejectUnauthorized: false
        },
        // Ajouter des timeouts stricts (10 secondes) pour éviter que la requête ne tourne dans le vide (cause de l'erreur 499)
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });

    // Vérification de la connexion SMTP avant envoi
    try {
        await transporter.verify();
        console.log('[EMAIL] ✅ Connexion SMTP OK');
    } catch (verifyError) {
        console.error('[EMAIL] ❌ Connexion SMTP ÉCHOUÉE:', verifyError.message);
        throw verifyError;
    }

    const mailOptions = {
        from: `"Lumo" <${smtpUser}>`,
        to: email,
        subject: subject,
        html: html,
        attachments: attachments || [],
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] ✅ Message envoyé avec succès: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL] ❌ Erreur lors de l\'envoi:', error.message);
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
            &copy; ${new Date().getFullYear()} Lumo - La gestion intelligente pour votre commerce.
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
            &copy; ${new Date().getFullYear()} Lumo - Sécurité et Intelligence.
        </div>
    </div>
    `;
};

const getNewsletterWelcomeTemplate = (title, body, logoUrl) => {
    const finalTitle = title || 'Bienvenue dans la communauté !';
    const finalBody = body || 'Votre inscription à la newsletter <strong>Lumo</strong> a été confirmée avec succès. Vous recevrez désormais en avant-première nos actualités, mises à jour et conseils pour booster votre commerce.';

    // Si logoUrl est fourni on l'utilise, sinon on recrée le logo Lumo en HTML/CSS pro
    const logoContent = logoUrl
        ? `<img src="${logoUrl}" alt="Lumo" style="height: 48px; width: auto;" />`
        : `
        <div style="display: inline-flex; align-items: center; gap: 12px; text-decoration: none;">
            <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); border-radius: 14px; position: relative; box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4); text-align: center; line-height: 44px; color: white; font-weight: 900; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 24px;">
                <div style="transform: rotate(-5deg);">L</div>
            </div>
            <span style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 32px; font-weight: 900; color: #1e293b; letter-spacing: -0.05em; line-height: 1;">
                Lumo
            </span>
        </div>
        `;

    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="margin-bottom: 24px;">
                ${logoContent}
            </div>
            <h1 style="color: #1e293b; margin-top: 12px; font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">${finalTitle}</h1>
        </div>
        
        <div style="background-color: #f8fafc; padding: 32px; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-top: 0;">Bonjour,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 0;">${finalBody}</p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 18px 36px; background-color: #6366f1; border-radius: 16px; font-weight: 900; color: #ffffff; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3); font-size: 16px; letter-spacing: 0.02em;">
                ACCÉDER À MON ESPACE
            </a>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 32px; margin-top: 40px;">
            <p style="color: #94a3b8; font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                Lumo - L'intelligence au service de votre commerce
            </p>
            <div style="color: #cbd5e1; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Lumo | Innovation & Performance
            </div>
        </div>
    </div>
    `;
};

const getDebtReminderTemplate = (clientName, montant, currency) => {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; background-color: #fff1f2; border: 1px solid #fecdd3;">
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 14px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(225, 29, 72, 0.4); text-align: center; line-height: 48px; color: white; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; font-size: 26px; font-weight: 900; transform: rotate(15deg);">
                    <div style="transform: rotate(-15deg);">L</div>
                </div>
                <div style="font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif; font-size: 38px; font-weight: 900; color: #1e293b; letter-spacing: -0.05em; line-height: 1;">
                    Lumo
                </div>
            </div>
            <h1 style="color: #1e293b; margin-top: 24px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Rappel de paiement</h1>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Bonjour <strong>${clientName}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Nous espérons que vous allez bien. Sauf erreur de notre part, nous remarquons qu'un montant reste en attente de règlement sur votre compte.</p>
        
        <div style="text-align: center; margin: 40px 0;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">Montant restant dû</p>
            <div style="display: inline-block; padding: 20px 40px; background-color: #ffffff; border: 2px dashed #e11d48; border-radius: 16px; font-size: 32px; font-weight: 900; color: #e11d48; letter-spacing: 0.05em; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                ${montant} ${currency}
            </div>
        </div>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6; border-top: 1px solid #fecdd3; paddingTop: 24px; margin-top: 32px;">
            Si ce paiement a déjà été effectué entre-temps, veuillez ignorer cet email.<br>
            Merci de votre confiance et de votre compréhension.
        </p>
        
        <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Lumo
        </div>
    </div>
    `;
};

module.exports = {
    sendEmail,
    getVerificationTemplate,
    getResetPasswordTemplate,
    getNewsletterWelcomeTemplate,
    getDebtReminderTemplate
};
