const express = require('express');
const router = express.Router();
const { getDashboardStats, getSalesChartData, getAnalytics } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

const { cacheMiddleware } = require('../utils/cache');

// Statistiques globales du dashboard (Cache 10 min)
router.get('/dashboard', protect, cacheMiddleware(600), getDashboardStats);

// Données pour les graphiques de ventes (Cache 5 min)
router.get('/sales-chart', protect, cacheMiddleware(300), getSalesChartData);

// Analytiques avancées (page /stats) (Cache 5 min)
router.get('/analytics', protect, cacheMiddleware(300), getAnalytics);

module.exports = router;
