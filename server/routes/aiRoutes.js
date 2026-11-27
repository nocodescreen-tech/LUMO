const express = require('express');
const router = express.Router();
const { getAIInsights, chatAI, getChatHistory, publicChatAI } = require('../controllers/aiController');
const { createFeedback } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Insights IA globaux basés sur les ventes, dépenses et stock
router.get('/insights', protect, authorize('admin','superadmin'), getAIInsights);

// Chat IA conversationnel pour le commerce
router.post('/chat', protect, authorize('admin','superadmin'), chatAI);
router.get('/chat/history', protect, authorize('admin','superadmin'), getChatHistory);

// Feedback pour les réponses de l'IA
router.post('/feedback', protect, createFeedback);

// Chat public pour la Landing Page (sans authentification)
router.post('/public-chat', publicChatAI);

module.exports = router;
