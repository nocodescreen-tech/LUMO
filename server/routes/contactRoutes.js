const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailService');

// Public contact form (no auth required)
router.post('/', async (req, res) => {
  try {
    const { nom, email, message } = req.body;

    if (!nom || !email || !message) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
    }

    // Envoyer un email à l'administrateur
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
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Votre message a été envoyé avec succès ! Nous vous répondrons dès que possible.' 
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ message: 'Une erreur est survenue lors de l\'envoi.' });
  }
});

module.exports = router;
