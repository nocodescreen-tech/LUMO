const Feedback = require('../models/Feedback');
const { sendResponse } = require('../utils/response');

exports.submitFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.create({
            ...req.body,
            userId: req.user.id
        });
        sendResponse(res, 201, feedback, 'Merci pour votre feedback !');
    } catch (error) {
        next(error);
    }
};

exports.getTutorials = async (req, res) => {
    const tutorials = {
        'dashboard': [
            { target: '#stats-card', content: 'Voici vos statistiques clés du jour.' },
            { target: '#ai-assistant', content: 'Posez vos questions stratégiques ici.' }
        ],
        'sales': [
            { target: '#product-search', content: 'Recherchez un produit par nom ou code-barre.' },
            { target: '#cart-total', content: 'Le total se met à jour instantanément.' }
        ]
    };
    const page = req.query.page || 'dashboard';
    sendResponse(res, 200, tutorials[page] || [], 'Tutoriel récupéré');
};
