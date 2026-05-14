const { Notification } = require('../models');

exports.getNotifications = async (req, res, next) => {
    try {
        // Use tenantId so ALL shop users (admin, cashier, seller) see the shop notifications
        // Notifications are created with product.userId which equals the shop owner's tenantId
        const userId = req.user.tenantId || req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 50);
        const offset = (page - 1) * limit;

        const { count, rows } = await Notification.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // Return array directly at top level for frontend compatibility
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.tenantId || req.user.id;

        if (!id) return res.status(400).json({ message: 'ID de notification requis' });

        await Notification.update(
            { lu: true },
            { where: { id, userId } }
        );
        res.status(200).json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        next(error);
    }
};

exports.markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.tenantId || req.user.id;
        await Notification.update(
            { lu: true },
            { where: { userId, lu: false } }
        );
        res.status(200).json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (error) {
        next(error);
    }
};

exports.deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.tenantId || req.user.id;

        if (!id) return res.status(400).json({ message: 'ID de notification requis' });

        await Notification.destroy({
            where: { id, userId }
        });
        res.status(200).json({ message: 'Notification supprimée' });
    } catch (error) {
        next(error);
    }
};

exports.deleteAllNotifications = async (req, res, next) => {
    try {
        const userId = req.user.tenantId || req.user.id;
        await Notification.destroy({
            where: { userId }
        });
        res.status(200).json({ message: 'Toutes les notifications ont été supprimées' });
    } catch (error) {
        next(error);
    }
};
