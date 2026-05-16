const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────
//  LOGO LUMO — SVG inline direct (source: /public/lumo_logo.svg)
//  Dégradés couleur : violet/rose/bleu (cristal 3D)
// ─────────────────────────────────────────────────────────────
const LUMO_SVG = `<svg width="52" height="52" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lt" x1="10" y1="45" x2="90" y2="45" gradientUnits="userSpaceOnUse">
      <stop stop-color="#a855f7"/><stop offset="1" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="ll" x1="10" y1="45" x2="50" y2="90" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ec4899"/><stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="lr" x1="90" y1="45" x2="50" y2="90" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3b82f6"/><stop offset="1" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <path d="M50 12 L86 45 L50 88 L14 45 Z" fill="url(#lt)" opacity="0.3"/>
  <path d="M14 45 L50 88 L50 55 Z" fill="url(#ll)"/>
  <path d="M86 45 L50 88 L50 55 Z" fill="url(#lr)"/>
  <path d="M14 45 L50 12 L86 45 L50 55 Z" fill="url(#lt)"/>
  <path d="M50 12 L14 45 L50 55 Z" fill="#ffffff" opacity="0.25"/>
  <path d="M50 55 L86 45 L50 48 Z" fill="#ffffff" opacity="0.15"/>
</svg>`;

// Logo avec texte sombre (sur fond blanc)
const logoBlockDark = () => `
<table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 32px;">
  <tr>
    <td style="vertical-align: middle; padding-right: 10px;">${LUMO_SVG}</td>
    <td style="vertical-align: middle;"><span style="font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 34px; font-weight: 900; color: #1e293b; letter-spacing: -0.05em;">Lumo</span></td>
  </tr>
</table>`;

// Logo avec texte blanc (sur fond coloré)
const logoBlockLight = () => `
<table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 24px;">
  <tr>
    <td style="vertical-align: middle; padding-right: 10px;">${LUMO_SVG}</td>
    <td style="vertical-align: middle;"><span style="font-family: 'Inter','Segoe UI',Arial,sans-serif; font-size: 34px; font-weight: 900; color: #ffffff; letter-spacing: -0.05em;">Lumo</span></td>
  </tr>
</table>`;

// ─────────────────────────────────────────────────────────────
//  RESEND (primary) — simple HTTP API, works on every cloud
// ─────────────────────────────────────────────────────────────
const sendViaResend = async ({ email, subject, html, attachments }) => {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromEmail = (process.env.FROM_EMAIL || 'Lumo <onboarding@resend.dev>').replace(/['"]/g, '').trim();

    console.log(`[EMAIL/RESEND] Envoi vers: ${email} (from: ${fromEmail})`);

    const payload = {
        from: fromEmail,
        to: [email],
        subject,
        html,
    };

    if (attachments && attachments.length > 0) {
        payload.attachments = attachments.map(a => ({
            filename: a.filename,
            content: a.content,
        }));
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
        console.error('[EMAIL/RESEND] ❌ Erreur API Resend:', JSON.stringify(error));
        throw new Error(error.message || 'Resend API error');
    }

    console.log(`[EMAIL/RESEND] ✅ Envoyé avec succès. ID: ${data.id}`);
    return true;
};

// ─────────────────────────────────────────────────────────────
//  NODEMAILER (fallback SMTP) — utilisé si RESEND_API_KEY absent
// ─────────────────────────────────────────────────────────────
const sendViaSMTP = async ({ email, subject, html, attachments }) => {
    const smtpUser  = (process.env.SMTP_USER || '').replace(/['"]/g, '').trim();
    const smtpPass  = (process.env.SMTP_PASS || '').replace(/['"]/g, '').replace(/\s/g, '');
    const smtpHost  = (process.env.SMTP_HOST || 'smtp.gmail.com').replace(/['"]/g, '').trim();
    const smtpPort  = parseInt(process.env.SMTP_PORT) || 587;
    const fromEmail = (process.env.FROM_EMAIL || '').replace(/['"]/g, '').trim();

    const fromFinal = fromEmail.includes('<') ? fromEmail : `"Lumo" <${smtpUser}>`;

    console.log(`[EMAIL/SMTP] Envoi vers: ${email} via ${smtpHost}:${smtpPort} (from: ${fromFinal})`);

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });

    try {
        await transporter.verify();
        console.log('[EMAIL/SMTP] ✅ Connexion SMTP OK');
    } catch (verifyError) {
        console.error('[EMAIL/SMTP] ❌ Connexion SMTP ÉCHOUÉE:', verifyError.message);
        throw verifyError;
    }

    const info = await transporter.sendMail({
        from: fromFinal,
        to: email,
        subject,
        html,
        attachments: attachments || [],
    });

    console.log(`[EMAIL/SMTP] ✅ Envoyé avec succès. ID: ${info.messageId}`);
    return true;
};

// ─────────────────────────────────────────────────────────────
//  DISPATCHER PRINCIPAL
//  Priorité : SMTP Gmail (si configuré) → Resend API (fallback)
//  Raison : Resend nécessite un domaine vérifié pour envoyer à n'importe qui
// ─────────────────────────────────────────────────────────────
const sendEmail = async ({ email, subject, html, attachments }) => {
    // Si SMTP configuré → priorité absolue (pas de restriction de domaine)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            return await sendViaSMTP({ email, subject, html, attachments });
        } catch (smtpError) {
            console.error('[EMAIL] ⚠️ SMTP échoué, tentative Resend:', smtpError.message);
            // Fallback Resend si disponible
            if (process.env.RESEND_API_KEY) {
                return await sendViaResend({ email, subject, html, attachments });
            }
            throw smtpError;
        }
    }

    // Pas de SMTP → Resend (nécessite domaine vérifié pour autres emails)
    if (process.env.RESEND_API_KEY) {
        return await sendViaResend({ email, subject, html, attachments });
    }

    throw new Error('[EMAIL] Aucun service email configuré (SMTP_USER ou RESEND_API_KEY requis)');
};

// ─────────────────────────────────────────────────────────────
//  TEMPLATES EMAIL — avec logo SVG Lumo réel
// ─────────────────────────────────────────────────────────────

const getVerificationTemplate = (code, name) => {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);">

                <!-- Header gradient -->
                <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 40px 36px; text-align: center;">
                        ${logoBlockLight()}
                        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Vérification de votre compte</h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Entrez le code ci-dessous pour activer votre compte</p>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding: 40px;">
                        <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">Bonjour <strong style="color: #1e293b;">${name}</strong>,</p>
                        <p style="margin: 0 0 32px; color: #475569; font-size: 15px; line-height: 1.7;">Merci de rejoindre <strong>Lumo</strong>. Pour finaliser la création de votre compte professionnel, veuillez utiliser le code de vérification suivant :</p>

                        <!-- OTP Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr><td align="center" style="padding: 8px 0 32px;">
                                <div style="display: inline-block; padding: 24px 48px; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 2px solid #7c3aed; border-radius: 20px; text-align: center;">
                                    <span style="font-size: 42px; font-weight: 900; color: #6d28d9; letter-spacing: 0.3em; font-family: 'Courier New', monospace;">${code}</span>
                                    <p style="margin: 10px 0 0; color: #9ca3af; font-size: 13px;">⏱️ Ce code expire dans <strong>15 minutes</strong></p>
                                </div>
                            </td></tr>
                        </table>

                        <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                            Si vous n'avez pas créé de compte Lumo, vous pouvez ignorer cet email en toute sécurité.
                        </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px 40px; text-align: center;">
                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Lumo — La gestion intelligente pour votre commerce.</p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`;
};

const getResetPasswordTemplate = (code, name) => {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #fff7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff7ed; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; border: 1px solid #fed7aa; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                    <td style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 40px 40px 36px; text-align: center;">
                        ${logoBlockLight()}
                        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Récupération de mot de passe</h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Utilisez le code ci-dessous pour sécuriser votre accès</p>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding: 40px;">
                        <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">Bonjour <strong style="color: #1e293b;">${name}</strong>,</p>
                        <p style="margin: 0 0 32px; color: #475569; font-size: 15px; line-height: 1.7;">Nous avons reçu une demande de réinitialisation pour votre compte Lumo. Utilisez le code suivant pour sécuriser votre accès :</p>

                        <!-- OTP Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr><td align="center" style="padding: 8px 0 32px;">
                                <div style="display: inline-block; padding: 24px 48px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px solid #ea580c; border-radius: 20px; text-align: center;">
                                    <span style="font-size: 42px; font-weight: 900; color: #ea580c; letter-spacing: 0.3em; font-family: 'Courier New', monospace;">${code}</span>
                                    <p style="margin: 10px 0 0; color: #9ca3af; font-size: 13px;">⏱️ Ce code expire dans <strong>1 heure</strong></p>
                                </div>
                            </td></tr>
                        </table>

                        <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6; border-top: 1px solid #fed7aa; padding-top: 24px;">
                            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe reste inchangé.
                        </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background-color: #fff7ed; border-top: 1px solid #fed7aa; padding: 24px 40px; text-align: center;">
                        <p style="margin: 0; color: #fb923c; font-size: 12px;">&copy; ${new Date().getFullYear()} Lumo — Sécurité et Intelligence.</p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`;
};

const getNewsletterWelcomeTemplate = (title, body, logoUrl) => {
    const finalTitle = title || 'Bienvenue dans la communauté !';
    const finalBody = body || 'Votre inscription à la newsletter <strong>Lumo</strong> a été confirmée avec succès. Vous recevrez désormais en avant-première nos actualités, mises à jour et conseils pour booster votre commerce.';

    const customLogoImg = logoUrl
        ? `<img src="${logoUrl}" alt="Lumo" style="height: 52px; width: auto; display: block; margin: 0 auto 24px;" />`
        : logoBlockLight();

    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 40px 36px; text-align: center;">
                        ${customLogoImg}
                        <h1 style="margin: 12px 0 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">${finalTitle}</h1>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding: 40px;">
                        <div style="background-color: #f8fafc; padding: 28px; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
                            <p style="margin: 0 0 12px; color: #475569; font-size: 16px; line-height: 1.6;">Bonjour,</p>
                            <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.7;">${finalBody}</p>
                        </div>

                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr><td align="center">
                                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}"
                                   style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 14px; font-weight: 900; color: #ffffff; text-decoration: none; font-size: 15px; letter-spacing: 0.03em;">
                                    ACCÉDER À MON ESPACE →
                                </a>
                            </td></tr>
                        </table>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px 40px; text-align: center;">
                        <p style="margin: 0 0 4px; color: #94a3b8; font-size: 13px; font-weight: 600;">Lumo — L'intelligence au service de votre commerce</p>
                        <p style="margin: 0; color: #cbd5e1; font-size: 12px;">&copy; ${new Date().getFullYear()} Lumo | Innovation &amp; Performance</p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`;
};

const getDebtReminderTemplate = (clientName, montant, currency) => {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #fff1f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff1f2; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; border: 1px solid #fecdd3; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                    <td style="background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); padding: 40px 40px 36px; text-align: center;">
                        ${logoBlockLight()}
                        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Rappel de paiement</h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Un montant est en attente de règlement sur votre compte</p>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding: 40px;">
                        <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">Bonjour <strong style="color: #1e293b;">${clientName}</strong>,</p>
                        <p style="margin: 0 0 32px; color: #475569; font-size: 15px; line-height: 1.7;">Nous espérons que vous allez bien. Sauf erreur de notre part, nous remarquons qu'un montant reste en attente de règlement sur votre compte.</p>

                        <!-- Amount Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr><td align="center" style="padding: 8px 0 32px;">
                                <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">Montant restant dû</p>
                                <div style="display: inline-block; padding: 24px 48px; background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border: 2px solid #e11d48; border-radius: 20px; text-align: center;">
                                    <span style="font-size: 38px; font-weight: 900; color: #e11d48; letter-spacing: 0.05em;">${montant} ${currency}</span>
                                </div>
                            </td></tr>
                        </table>

                        <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6; border-top: 1px solid #fecdd3; padding-top: 24px;">
                            Si ce paiement a déjà été effectué entre-temps, veuillez ignorer cet email.<br>
                            Merci de votre confiance et de votre compréhension.
                        </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background-color: #fff1f2; border-top: 1px solid #fecdd3; padding: 24px 40px; text-align: center;">
                        <p style="margin: 0; color: #fb7185; font-size: 12px;">&copy; ${new Date().getFullYear()} Lumo</p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`;
};

module.exports = {
    sendEmail,
    getVerificationTemplate,
    getResetPasswordTemplate,
    getNewsletterWelcomeTemplate,
    getDebtReminderTemplate
};
