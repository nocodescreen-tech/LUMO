const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { Activite, User, Op } = require('../models');

// Fetch activities
// - SuperAdmin → toutes les activités
// - Utilisateur normal → uniquement ses propres activités
router.get('/', protect, async (req, res) => {
    try {
        const { limit = 20, page = 1, type, module } = req.query;
        const offset = (page - 1) * limit;

        const isSuperAdmin = req.user.role === 'superadmin';

        let whereClause = isSuperAdmin
            ? {} 
            : { shopId: req.user.tenantId || req.user.id };

        if (type) whereClause.type = type;
        if (module) whereClause.module = module;

        const { count, rows: activities } = await Activite.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'user',
                attributes: ['nom', 'email', 'role']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const { sendResponse } = require('../utils/response');
        sendResponse(res, 200, {
            activities,
            total: count,
            pages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        }, 'Activités récupérées');
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des activités' });
    }
});

module.exports = router;

