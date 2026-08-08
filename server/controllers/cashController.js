const { CashSession, Sale } = require('../models');
const { Op } = require('sequelize');
const { logActivite } = require('./activiteController');

exports.getCurrentSession = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const session = await CashSession.findOne({
            where: { userId, status: 'OPEN' }
        });

        if (!session) {
            return res.status(200).json(null);
        }

        // Recalculer dynamiquement les totaux avec conversion de devise correcte
        const owner = await require('../models/User').findByPk(userId);
        const shopCurrency = owner?.entreprise?.devise || 'CDF';
        const defaultRate = Number(owner?.preferences?.exchangeRate || 2800);

        const sales = await Sale.findAll({
            where: { userId, createdAt: { [Op.gte]: session.openingTime } }
        });

        // Tous les montants sont stockés en CDF dans la DB
        const totalSales = sales.reduce((acc, s) => acc + Number(s.montantTotal || 0), 0);

        const totalExpenses = 0;

        // Mettre à jour la session avec les valeurs recalculées (sans sauvegarder en DB)
        const sessionData = session.toJSON();
        sessionData.totalSales = totalSales;
        sessionData.totalExpenses = totalExpenses;
        sessionData.expectedBalance = Number(session.openingBalance) + totalSales - totalExpenses;

        res.status(200).json(sessionData);
    } catch (error) {
        next(error);
    }
};

exports.openSession = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const { openingBalance, note } = req.body;

        // Vérifier si une session est déjà ouverte
        const existingSession = await CashSession.findOne({
            where: { userId, status: 'OPEN' }
        });

        if (existingSession) {
            // Au lieu de renvoyer une erreur, on renvoie la session existante pour être idempotent
            const { sendResponse } = require('../utils/response');
            return sendResponse(res, 200, existingSession, 'Session déjà ouverte');
        }

        const session = await CashSession.create({
            userId,
            openingBalance: openingBalance || 0,
            expectedBalance: openingBalance || 0,
            note,
            status: 'OPEN'
        });

        // Log activité
        await logActivite(req.user.id, 'CAISSE', , 'Caisse', userId);
        const { sendResponse } = require('../utils/response');
        sendResponse(res, 201, session, 'Caisse ouverte');
    } catch (error) {
        next(error);
    }
};

exports.closeSession = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const { closingBalance, note } = req.body;

        const session = await CashSession.findOne({
            where: { userId, status: 'OPEN' }
        });

        if (!session) {
            return res.status(404).json({ message: "Aucune session ouverte trouvée." });
        }

        // Calculer les ventes depuis l'ouverture
        const sales = await Sale.findAll({
            where: {
                userId,
                createdAt: { [Op.gte]: session.openingTime }
            }
        });

        // Récupérer la devise de la boutique pour normaliser
        const owner = await require('../models/User').findByPk(userId);
        const shopCurrency = owner?.entreprise?.devise || 'CDF';
        const defaultRate = Number(owner?.preferences?.exchangeRate || 2800);

        // Tous les montants sont stockés en CDF dans la DB
        const totalSales = sales.reduce((acc, s) => acc + Number(s.montantTotal || 0), 0);

        const totalExpenses = 0;
        
        const expectedBalance = Number(session.openingBalance) + totalSales - totalExpenses;

        await session.update({
            closingTime: new Date(),
            closingBalance: closingBalance || expectedBalance,
            expectedBalance,
            totalSales,
            totalExpenses,
            status: 'CLOSED',
            note: note || session.note
        });

        // Log activité
        await logActivite(req.user.id, 'CAISSE', , 'Caisse', userId);
        res.status(200).json(session);
    } catch (error) {
        next(error);
    }
};

exports.getSessions = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const sessions = await CashSession.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        const { sendResponse } = require('../utils/response');
        sendResponse(res, 200, sessions, 'Historique des sessions récupéré');
    } catch (error) {
        next(error);
    }
};

exports.deleteSession = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const { id } = req.params;
        
        const session = await CashSession.findOne({
            where: { id, userId }
        });

        if (!session) {
            const { sendResponse } = require('../utils/response');
            return sendResponse(res, 404, null, 'Session introuvable');
        }

        await session.destroy();
        
        const { sendResponse } = require('../utils/response');
        sendResponse(res, 200, null, 'Session supprimée avec succès');
    } catch (error) {
        next(error);
    }
};
