const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { 
    Product, Sale, Client, Fournisseur, Depense, Purchase, 
    StockMovement, CashSession, Activite, Notification, User, Feedback 
} = require('../models');
const { uploadBackup } = require('../services/firebaseService');
const logger = require('../utils/logger');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Créer le dossier backups s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Nettoyer les anciennes sauvegardes (garder les 7 derniers jours)
const cleanupOldBackups = () => {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const now = Date.now();
        const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > MAX_AGE_MS) {
                    fs.unlinkSync(filePath);
                    console.log(`[Cron Backup] Ancienne sauvegarde supprimée : ${file}`);
                }
            }
        });
    } catch (err) {
        console.error('[Cron Backup] Erreur lors du nettoyage des anciennes sauvegardes :', err);
    }
};

const executeDailyBackup = async (forcedHour = null) => {
    const now = new Date();
    const currentHour = forcedHour !== null ? forcedHour : now.getHours();
    
    console.log(`[Cron Backup] Vérification des sauvegardes pour l'heure : ${currentHour}h`);
    
    try {
        // Trouver tous les propriétaires de comptes (admins et superadmins)
        const accountOwners = await User.findAll({
            where: {
                role: ['admin', 'superadmin']
            }
        });

        for (const owner of accountOwners) {
            // Vérifier si l'utilisateur a activé la sauvegarde automatique
            const prefs = owner.preferences || {};
            if (prefs.autoBackupEnabled !== true) {
                continue;
            }

            // Vérifier l'heure de sauvegarde (format HH:mm, défaut 00:00)
            const backupTime = prefs.backupTime || '00:00';
            const [prefHour, prefMin] = backupTime.split(':').map(Number);

            // On lance la sauvegarde si l'heure correspond
            // Si on tourne toutes les heures, on vérifie juste l'heure.
            if (prefHour !== currentHour) {
                continue;
            }

            console.log(`[Cron Backup] Exécution de la sauvegarde pour ${owner.email} (Heure préférée: ${backupTime})`);

            const userId = owner.id;
            
            const [
                products, sales, clients, fournisseurs, depenses, purchases,
                movements, sessions, activities, notifications, subUsers, feedbacks
            ] = await Promise.all([
                Product.findAll({ where: { userId } }),
                Sale.findAll({ where: { userId } }),
                Client.findAll({ where: { userId } }),
                Fournisseur.findAll({ where: { userId } }),
                Depense.findAll({ where: { userId } }),
                Purchase.findAll({ where: { userId } }),
                StockMovement.findAll({ where: { userId } }),
                CashSession.findAll({ where: { userId } }),
                Activite.findAll({ where: { UserId: userId } }),
                Notification.findAll({ where: { userId } }),
                User.findAll({ where: { parentId: userId } }),
                Feedback.findAll({ where: { userId } })
            ]);

            // Ne sauvegarder que s'il y a des données significatives
            if (products.length > 0 || sales.length > 0 || clients.length > 0) {
                const backupData = {
                    version: '1.2',
                    exportedAt: new Date().toISOString(),
                    user: userId,
                    userEmail: owner.email,
                    data: {
                        products: products.map(p => p.get({ plain: true })),
                        sales: sales.map(s => s.get({ plain: true })),
                        clients: clients.map(c => c.get({ plain: true })),
                        fournisseurs: fournisseurs.map(f => f.get({ plain: true })),
                        depenses: depenses.map(d => d.get({ plain: true })),
                        purchases: purchases.map(p => p.get({ plain: true })),
                        movements: movements.map(m => m.get({ plain: true })),
                        sessions: sessions.map(s => s.get({ plain: true })),
                        activities: activities.map(a => a.get({ plain: true })),
                        notifications: notifications.map(n => n.get({ plain: true })),
                        subUsers: subUsers.map(u => {
                            const plain = u.get({ plain: true });
                            delete plain.motDePasse;
                            return plain;
                        }),
                        feedbacks: feedbacks.map(f => f.get({ plain: true }))
                    }
                };

                const dateStr = new Date().toISOString().split('T')[0];
                const fileName = `lumo_sauvegarde_user_${userId}_${dateStr}.json.enc`;
                const filePath = path.join(BACKUP_DIR, fileName);

                const crypto = require('crypto');
                const algorithm = 'aes-256-ctr';
                const secretKey = process.env.BACKUP_ENCRYPTION_KEY || 'votre_cle_de_chiffrement_32_chars_';
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv(algorithm, secretKey.substring(0, 32), iv);
                
                const dataString = JSON.stringify(backupData);
                const encrypted = Buffer.concat([iv, cipher.update(dataString), cipher.final()]);

                fs.writeFileSync(filePath, encrypted);
                console.log(`[Cron Backup] Sauvegarde chiffrée réussie pour ${owner.email} -> ${fileName}`);

                await uploadBackup(filePath, fileName);
                
                if (global.io) {
                    global.io.to(`user_${userId}`).emit('notification', {
                        titre: 'Sauvegarde réussie',
                        message: `Votre sauvegarde automatique quotidienne (${backupTime}) a été générée et chiffrée.`,
                        type: 'SUCCESS'
                    });
                }
            }
        }

        cleanupOldBackups();

    } catch (error) {
        console.error('[Cron Backup] Erreur critique lors de la sauvegarde :', error);
    }
};

// Initialisation de la tâche planifiée
const initBackupCron = () => {
    // Tâche de vérification toutes les heures
    cron.schedule('0 * * * *', () => {
        executeDailyBackup();
    }, {
        scheduled: true,
        timezone: "Africa/Kinshasa"
    });

    // Health Check toutes les 30 minutes
    cron.schedule('*/30 * * * *', () => {
        console.log(`[Cron Health] Système de sauvegarde actif - ${new Date().toLocaleString('fr-FR')}`);
    });

    console.log('[Cron] Système de sauvegarde automatique initialisé (vérification horaire).');
};

module.exports = { initBackupCron, executeDailyBackup };
