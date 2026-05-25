const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailService');
const { Activite } = require('../models');

router.post('/', async (req, res) => {
  try {
    const { nom, email, message } = req.body;
    if (!nom || !email || !message) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
    }

    await sendEmail({
      email: 'no.codescreen@gmail.com',
      subject: `[LUMO] Nouvelle question de ${nom}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6d28d9;">Nouvelle demande de contact</h2>
          <p><strong>Nom :</strong> ${nom}</p>
          <p><strong>Email :</strong> ${email}</p>
          <hr />
          <p><strong>Message :</strong></p>
          <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
        </div>
      `,
    });

    await Activite.create({
      type: 'LANDING_MESSAGE',
      description: JSON.stringify({ nom, email, message, createdAt: new Date().toISOString() }),
      module: 'Landing',
      userNom: nom,
      source: 'Public',
      UserId: null,
      shopId: null,
    });

    return res.status(200).json({
      success: true,
      message: 'Votre message a ete envoye avec succes ! Nous vous repondrons des que possible.',
    });
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ message: "Une erreur est survenue lors de l'envoi." });
  }
});

router.post('/visit', async (req, res) => {
  try {
    const { path = '/', referrer = '', ua = '', lang = '' } = req.body || {};
    await Activite.create({
      type: 'LANDING_VISIT',
      description: JSON.stringify({
        path,
        referrer,
        ua: String(ua).slice(0, 300),
        lang: String(lang).slice(0, 50),
        createdAt: new Date().toISOString(),
      }),
      module: 'Landing',
      userNom: 'Visiteur',
      source: 'Public',
      UserId: null,
      shopId: null,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(200).json({ success: false });
  }
});

module.exports = router;
