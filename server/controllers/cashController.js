const { CashSession, Sale, Depense } = require('../models');
const { Op } = require('sequelize');

exports.getCurrentSession = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const session = await CashSession.findOne({
            where: { userId, status: 'OPEN' }
        });
        res.status(200).json(session);
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

        // Calculer les ventes et dépenses depuis l'ouverture
        const sales = await Sale.findAll({
            where: {
                userId,
                createdAt: { [Op.gte]: session.openingTime }
            }
        });

        const expenses = await Depense.findAll({
            where: {
                userId,
                createdAt: { [Op.gte]: session.openingTime }
            }
        });

        const totalSales = sales.reduce((acc, s) => acc + Number(s.montantTotal), 0);
        const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.montant), 0);
        
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
