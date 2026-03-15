const express = require('express');
const router = express.Router();
const { getDashboardStats, getSalesChartData } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

// Statistiques globales du dashboard
router.get('/dashboard', protect, getDashboardStats);

// Données pour les graphiques de ventes
router.get('/sales-chart', protect, getSalesChartData);

module.exports = router;
