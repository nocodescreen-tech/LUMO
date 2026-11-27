const crypto = require('crypto');
const {
    Product, Sale, Client, Fournisseur, Purchase,
    StockMovement, CashSession, Activite, Notification, User, Feedback, StaffPayment
} = require('../models');
const { sendEmail } = require('../utils/emailService');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const decryptBackupBuffer = (buffer) => {
    const algorithm = 'aes-256-ctr';
    const secretKey = (process.env.BACKUP_ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);
    
    const iv = buffer.subarray(0, 16);
    const ciphertext = buffer.subarray(16);
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
};


/**
 * GET /api/backup/export
 * Télécharger un fichier JSON de sauvegarde
 */
exports.exportBackup = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [
            products, sales, clients, fournisseurs, purchases,
            movements, sessions, activities, notifications, subUsers, feedbacks, staffPayments
        ] = await Promise.all([
            Product.findAll({ where: { userId } }),
            Sale.findAll({ where: { userId } }),
            Client.findAll({ where: { userId } }),
            Fournisseur.findAll({ where: { userId } }),
            Purchase.findAll({ where: { userId } }),
            StockMovement.findAll({ where: { userId } }),
            CashSession.findAll({ where: { userId } }),
            Activite.findAll({ where: { UserId: userId } }),
            Notification.findAll({ where: { userId } }),
            User.findAll({ where: { parentId: userId } }),
            Feedback.findAll({ where: { userId } }),
            StaffPayment.findAll({ where: { userId } })
        ]);

        const backupData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            user: userId,
            data: {
                products: products.map(p => p.get({ plain: true })),
                sales: sales.map(s => s.get({ plain: true })),
                clients: clients.map(c => c.get({ plain: true })),
                fournisseurs: fournisseurs.map(f => f.get({ plain: true })),
                purchases: purchases.map(p => p.get({ plain: true })),
                movements: movements.map(m => m.get({ plain: true })),
                sessions: sessions.map(s => s.get({ plain: true })),
                activities: activities.map(a => a.get({ plain: true })),
                notifications: notifications.map(n => n.get({ plain: true })),
                feedbacks: feedbacks.map(f => f.get({ plain: true })),
                staffPayments: staffPayments.map(sp => sp.get({ plain: true })),
                subUsers: subUsers.map(u => {
                    const plain = u.get({ plain: true });
                    for(const field of ['motDePasse','verificationCode','resetPasswordToken','resetPasswordExpire','twoFactorSecret','twoFactorCode','twoFactorExpire','activeSessions','chatHistory'])delete plain[field];
                    return plain;
                })
            }
        };

        const fileName = `lumo_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-type', 'application/json');
        res.status(200).send(JSON.stringify(backupData, null, 2));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/backup/email
 * Envoyer la sauvegarde par e-mail
 */
exports.exportEmailBackup = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [
            products, sales, clients, fournisseurs, purchases,
            movements, sessions, activities, notifications, subUsers, feedbacks, staffPayments
        ] = await Promise.all([
            Product.findAll({ where: { userId } }),
            Sale.findAll({ where: { userId } }),
            Client.findAll({ where: { userId } }),
            Fournisseur.findAll({ where: { userId } }),
            Purchase.findAll({ where: { userId } }),
            StockMovement.findAll({ where: { userId } }),
            CashSession.findAll({ where: { userId } }),
            Activite.findAll({ where: { UserId: userId } }),
            Notification.findAll({ where: { userId } }),
            User.findAll({ where: { parentId: userId } }),
            Feedback.findAll({ where: { userId } }),
            StaffPayment.findAll({ where: { userId } })
        ]);

        const backupData = {
            version: '1.2',
            exportedAt: new Date().toISOString(),
            user: userId,
            data: {
                products: products.map(p => p.get({ plain: true })),
                sales: sales.map(s => s.get({ plain: true })),
                clients: clients.map(c => c.get({ plain: true })),
                fournisseurs: fournisseurs.map(f => f.get({ plain: true })),
                purchases: purchases.map(p => p.get({ plain: true })),
                movements: movements.map(m => m.get({ plain: true })),
                sessions: sessions.map(s => s.get({ plain: true })),
                activities: activities.map(a => a.get({ plain: true })),
                notifications: notifications.map(n => n.get({ plain: true })),
                feedbacks: feedbacks.map(f => f.get({ plain: true })),
                staffPayments: staffPayments.map(sp => sp.get({ plain: true })),
                subUsers: subUsers.map(u => {
                    const plain = u.get({ plain: true });
                    for(const field of ['motDePasse','verificationCode','resetPasswordToken','resetPasswordExpire','twoFactorSecret','twoFactorCode','twoFactorExpire','activeSessions','chatHistory'])delete plain[field];
                    return plain;
                })
            }
        };

        const fileName = `lumo_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
        const fileContent = JSON.stringify(backupData, null, 2);

        const htmlContent = `
            <h2>📦 Sauvegarde de vos données Lumo</h2>
            <p>Bonjour <strong>${req.user.nom || ''}</strong>,</p>
            <p>Veuillez trouver ci-joint la sauvegarde complète de vos données (Produits, Ventes, Clients, Stocks, Sessions, etc.) effectuée le <strong>${new Date().toLocaleDateString('fr-FR')}</strong>.</p>
            <ul>
                <li>🛍️ Produits : <strong>${backupData.data.products.length}</strong></li>
                <li>💰 Ventes : <strong>${backupData.data.sales.length}</strong></li>
                <li>💰 Achat : <strong>${backupData.data.purchases.length}</strong></li>
                <li>👥 Clients : <strong>${backupData.data.clients.length}</strong></li>
                <li>📦 Mouvements de stock : <strong>${backupData.data.movements.length}</strong></li>
                <li>🏪 Sessions de caisse : <strong>${backupData.data.sessions.length}</strong></li>
                <li>👥 Équipe (Sous-utilisateurs) : <strong>${backupData.data.subUsers.length}</strong></li>
            </ul>
            <p>Cordialement,<br>L'équipe Lumo.</p>
        `;

        await sendEmail({
            email: req.user.email,
            subject: '📦 Votre sauvegarde de données Lumo',
            html: htmlContent,
            attachments: [{ filename: fileName, content: fileContent }]
        });

        res.status(200).json({ message: 'Backup envoyé avec succès par e-mail.' });
    } catch (error) {
        console.error('Erreur Export Email:', error);
        next(error);
    }
};

/**
 * POST /api/backup/import
 * Restaurer les données depuis un fichier JSON de sauvegarde
 * Stratégie : upsert pour les produits et clients, skip les ventes pour éviter doublons.
 */
exports.importBackup = async (req, res, next) => {
    let t;
    try {
        const userId = req.user.id;
        let backup = req.body;

        if (backup && backup.encryptedData) {
            try {
                const encryptedBuffer = Buffer.from(backup.encryptedData, 'base64');
                const decryptedData = decryptBackupBuffer(encryptedBuffer);
                backup = JSON.parse(decryptedData.toString('utf8'));
            } catch (err) {
                return res.status(400).json({ message: 'Fichier de sauvegarde chiffré invalide ou clé de déchiffrement incorrecte.' });
            }
        }

        // Validation de base du fichier
        if (!backup || !backup.version || !backup.data) {
            return res.status(400).json({ message: 'Fichier de sauvegarde invalide ou corrompu.' });
        }

        t = await sequelize.transaction();

        const {
            products = [], clients = [], sales = [], fournisseurs = [],
            purchases = [], movements = [], sessions = [],
            activities = [], notifications = [], subUsers = [], feedbacks = [], staffPayments = []
        } = backup.data;

        let restoredProducts = 0;
        let restoredClients = 0;
        let restoredSales = 0;
        let restoredFournisseurs = 0;
        let restoredPurchases = 0;
        let restoredMovements = 0;
        let restoredSessions = 0;
        let restoredActivities = 0;
        let restoredNotifications = 0;
        let restoredSubUsers = 0;
        let restoredFeedbacks = 0;
        let restoredStaffPayments = 0;

        // --- Restaurer les Produits (upsert par nom) ---
        for (const p of products) {
            const { id, createdAt, updatedAt, userId: _uid, ...productData } = p;
            await Product.upsert(
                { ...productData, userId, codeBarre: productData.codeBarre || null },
                { transaction: t }
            );
            restoredProducts++;
        }

        // --- Restaurer les Clients (upsert par telephone) ---
        for (const c of clients) {
            const { id, createdAt, updatedAt, userId: _uid, ...clientData } = c;
            let existing = null;
            if (clientData.telephone) {
                existing = await Client.findOne({ where: { userId, telephone: clientData.telephone }, transaction: t });
            }
            if (existing) {
                await existing.update({ ...clientData, userId }, { transaction: t });
            } else {
                await Client.create({ ...clientData, userId }, { transaction: t });
            }
            restoredClients++;
        }

        // --- Restaurer les Fournisseurs ---
        for (const f of fournisseurs) {
            const { id, createdAt, updatedAt, userId: _uid, ...fournisseurData } = f;
            let existing = null;
            if (fournisseurData.email) {
                existing = await Fournisseur.findOne({ where: { userId, email: fournisseurData.email }, transaction: t });
            }
            if (existing) {
                await existing.update({ ...fournisseurData, userId }, { transaction: t });
            } else {
                await Fournisseur.create({ ...fournisseurData, userId }, { transaction: t });
            }
            restoredFournisseurs++;
        }

        // --- Restaurer les Achats ---
        for (const p of purchases) {
            const { id, createdAt, updatedAt, userId: _uid, ...purchaseData } = p;
            const existing = await Purchase.findOne({
                where: { userId, montantTotal: purchaseData.montantTotal, createdAt: purchaseData.createdAt || null },
                transaction: t
            });
            if (!existing) {
                await Purchase.create({ ...purchaseData, userId }, { transaction: t });
                restoredPurchases++;
            }
        }

        // --- Restaurer les Ventes ---
        for (const s of sales) {
            const { id, createdAt, updatedAt, userId: _uid, ...saleData } = s;
            const existing = await Sale.findOne({
                where: { userId, montantTotal: saleData.montantTotal, createdAt: saleData.createdAt || null },
                transaction: t
            });
            if (!existing) {
                await Sale.create({ ...saleData, userId }, { transaction: t });
                restoredSales++;
            }
        }

        // --- Restaurer les Mouvements de stock ---
        for (const m of movements) {
            const { id, createdAt, updatedAt, userId: _uid, ...moveData } = m;
            await StockMovement.create({ ...moveData, userId }, { transaction: t });
            restoredMovements++;
        }

        // --- Restaurer les Sessions de caisse ---
        for (const s of sessions) {
            const { id, createdAt, updatedAt, userId: _uid, ...sessData } = s;
            await CashSession.create({ ...sessData, userId }, { transaction: t });
            restoredSessions++;
        }

        // --- Restaurer les Activités ---
        for (const a of activities) {
            const { id, createdAt, updatedAt, UserId: _uid, ...actData } = a;
            await Activite.create({ ...actData, UserId: userId }, { transaction: t });
            restoredActivities++;
        }

        // --- Restaurer les Notifications ---
        for (const n of notifications) {
            const { id, createdAt, updatedAt, userId: _uid, ...notifData } = n;
            await Notification.create({
                ...notifData,
                userId,
                contenu: notifData.contenu || 'Contenu manquant'
            }, { transaction: t });
            restoredNotifications++;
        }

        // --- Restaurer les Feedbacks ---
        for (const f of feedbacks) {
            const { id, createdAt, updatedAt, userId: _uid, ...feedData } = f;
            await Feedback.create({ ...feedData, userId }, { transaction: t });
            restoredFeedbacks++;
        }

        // --- Restaurer les Paiements de l'équipe ---
        for (const sp of staffPayments) {
            const { id, createdAt, updatedAt, userId: _uid, staffId, ...spData } = sp;
            const existing = await StaffPayment.findOne({
                where: { userId, staffId, amount: spData.amount, type: spData.type, date: spData.date || null },
                transaction: t
            });
            if (!existing) {
                await StaffPayment.create({ ...spData, userId, staffId }, { transaction: t });
                restoredStaffPayments++;
            }
        }

        // --- Restaurer les Sous-utilisateurs ---
        for (const u of subUsers) {
            const { id, createdAt, updatedAt, parentId: _pid, ...userData } = u;
            const existing = await User.findOne({ where: { email: userData.email }, transaction: t });
            if (!existing) {
                await User.create({ ...userData, parentId: userId, motDePasse: 'Lumo1234' }, { transaction: t });
                restoredSubUsers++;
            }
        }

        await t.commit();

        res.status(200).json({
            message: 'Sauvegarde restaurée avec succès !',
            restored: {
                products: restoredProducts,
                clients: restoredClients,
                sales: restoredSales,
                fournisseurs: restoredFournisseurs,
                purchases: restoredPurchases,
                movements: restoredMovements,
                sessions: restoredSessions,
                activities: restoredActivities,
                notifications: restoredNotifications,
                subUsers: restoredSubUsers,
                feedbacks: restoredFeedbacks,
                staffPayments: restoredStaffPayments
            }
        });

    } catch (error) {
        if (t) {
            try {
                await t.rollback();
            } catch (rollbackError) {
                console.error('Failed to rollback transaction:', rollbackError);
            }
        }
        console.error('Erreur Import Backup:', error);
        next(error);
    }
};

/**
 * POST /api/backup/preview
 * Prévisualiser le contenu d'un fichier de sauvegarde sans l'appliquer
 */
exports.previewBackup = async (req, res, next) => {
    try {
        let backup = req.body;

        if (backup && backup.encryptedData) {
            try {
                const encryptedBuffer = Buffer.from(backup.encryptedData, 'base64');
                const decryptedData = decryptBackupBuffer(encryptedBuffer);
                backup = JSON.parse(decryptedData.toString('utf8'));
            } catch (err) {
                return res.status(400).json({ message: 'Fichier de sauvegarde chiffré invalide ou clé de déchiffrement incorrecte.' });
            }
        }

        if (!backup || !backup.version || !backup.data) {
            return res.status(400).json({ message: 'Fichier de sauvegarde invalide.' });
        }

        res.status(200).json({
            version: backup.version,
            exportedAt: backup.exportedAt,
            counts: {
                products: (backup.data.products || []).length,
                clients: (backup.data.clients || []).length,
                sales: (backup.data.sales || []).length,
                fournisseurs: (backup.data.fournisseurs || []).length,
                purchases: (backup.data.purchases || []).length,
                movements: (backup.data.movements || []).length,
                sessions: (backup.data.sessions || []).length,
                activities: (backup.data.activities || []).length,
                notifications: (backup.data.notifications || []).length,
                subUsers: (backup.data.subUsers || []).length,
                feedbacks: (backup.data.feedbacks || []).length,
                staffPayments: (backup.data.staffPayments || []).length,
            }
        });
    } catch (error) {
        next(error);
    }
};
