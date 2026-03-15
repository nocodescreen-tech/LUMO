const { Notification } = require('../models');

exports.getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.status(200).json(notifications);
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await Notification.update(
            { lu: true },
            { where: { id: req.params.id, userId } }
        );
        res.status(200).json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        next(error);
    }
};

exports.markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
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
        const userId = req.user.id;
        await Notification.destroy({
            where: { id: req.params.id, userId }
        });
        res.status(200).json({ message: 'Notification supprimée' });
    } catch (error) {
        next(error);
    }
};
