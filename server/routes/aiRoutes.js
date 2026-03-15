const express = require('express');
const router = express.Router();
const { getAIInsights, chatAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Insights IA globaux basés sur les ventes, dépenses et stock
router.get('/insights', protect, getAIInsights);

// Chat IA conversationnel pour le commerce
router.post('/chat', protect, chatAI);

module.exports = router;

