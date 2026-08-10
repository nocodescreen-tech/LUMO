const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  Product,
  Sale,
  Client,
  Fournisseur,
  Purchase,
  StockMovement,
  CashSession,
  Activite,
  Notification,
  User,
  Feedback,
  StaffPayment,
} = require('../models');
const { uploadBackup } = require('../services/firebaseService');
const { sendEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const TZ = 'Africa/Kinshasa';

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const cleanupOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      if (!file.endsWith('.json') && !file.endsWith('.json.enc')) return;
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        logger.info(`[Cron Backup] Deleted old backup: ${file}`);
      }
    });
  } catch (err) {
    logger.error('[Cron Backup] Cleanup error', err);
  }
};

const kinshasaNowParts = (date = new Date()) => {
  const hm = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .split(':')
    .map(Number);

  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);
  return { hour: hm[0], minute: hm[1], day };
};

const executeDailyBackup = async () => {
  const now = new Date();
  const { hour, minute, day } = kinshasaNowParts(now);
  logger.info(`[Cron Backup] Checking schedules for ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} (${TZ})`);

  try {
    const accountOwners = await User.findAll({
      where: { role: ['admin', 'superadmin'] },
    });

    for (const owner of accountOwners) {
      const prefs = owner.preferences || {};
      if (prefs.autoBackupEnabled !== true) continue;

      const backupTime = typeof prefs.backupTime === 'string' ? prefs.backupTime : '00:00';
      if (!/^\d{2}:\d{2}$/.test(backupTime)) {
        logger.warn(`[Cron Backup] Invalid backupTime for ${owner.email}: ${backupTime}`);
        continue;
      }

      const [prefHour, prefMinute] = backupTime.split(':').map(Number);
      if (prefHour !== hour || prefMinute !== minute) continue;

      if (prefs.lastAutoBackupAt === day && prefs.lastAutoBackupTime === backupTime) {
        continue;
      }

      const userId = owner.id;
      logger.info(`[Cron Backup] Running backup for ${owner.email} at ${backupTime}`);

      const [
        products,
        sales,
        clients,
        fournisseurs,
        purchases,
        movements,
        sessions,
        activities,
        notifications,
        subUsers,
        feedbacks,
        staffPayments,
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
        StaffPayment.findAll({ where: { userId } }),
      ]);

      const backupData = {
        version: '1.2',
        exportedAt: now.toISOString(),
        user: userId,
        userEmail: owner.email,
        data: {
          products: products.map((p) => p.get({ plain: true })),
          sales: sales.map((s) => s.get({ plain: true })),
          clients: clients.map((c) => c.get({ plain: true })),
          fournisseurs: fournisseurs.map((f) => f.get({ plain: true })),
          purchases: purchases.map((p) => p.get({ plain: true })),
          movements: movements.map((m) => m.get({ plain: true })),
          sessions: sessions.map((s) => s.get({ plain: true })),
          activities: activities.map((a) => a.get({ plain: true })),
          notifications: notifications.map((n) => n.get({ plain: true })),
          subUsers: subUsers.map((u) => {
            const plain = u.get({ plain: true });
            delete plain.motDePasse;
            return plain;
          }),
          feedbacks: feedbacks.map((f) => f.get({ plain: true })),
          staffPayments: staffPayments.map((sp) => sp.get({ plain: true })),
        },
      };

      const dateStr = now.toISOString().split('T')[0];
      const fileName = `lumo_backup_user_${userId}_${dateStr}.json.enc`;
      const filePath = path.join(BACKUP_DIR, fileName);

      const algorithm = 'aes-256-ctr';
      const secretKey = (process.env.BACKUP_ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
      const encrypted = Buffer.concat([iv, cipher.update(JSON.stringify(backupData)), cipher.final()]);
      fs.writeFileSync(filePath, encrypted);

      try {
        await uploadBackup(filePath, fileName);
      } catch (uploadErr) {
        logger.warn(`[Cron Backup] Remote upload failed for ${owner.email}: ${uploadErr.message}`);
      }

      await sendEmail({
        email: owner.email,
        subject: `Sauvegarde automatique Lumo (${backupTime})`,
        html: `
          <h2>Sauvegarde automatique executee</h2>
          <p>Bonjour ${owner.nom || ''},</p>
          <p>Votre sauvegarde automatique planifiee a ${backupTime} a bien ete generee.</p>
          <p>Le fichier de sauvegarde chiffre est joint a ce message.</p>
        `,
        attachments: [{ filename: fileName, content: fs.readFileSync(filePath) }],
      });

      owner.preferences = {
        ...prefs,
        lastAutoBackupAt: day,
        lastAutoBackupTime: backupTime,
      };
      owner.changed('preferences', true);
      await owner.save({ hooks: false });

      if (global.io) {
        global.io.to(`user_${userId}`).emit('notification', {
          titre: 'Sauvegarde reussie',
          message: `Votre sauvegarde automatique (${backupTime}) a ete generee et envoyee par email.`,
          type: 'SUCCESS',
        });
      }
    }

    cleanupOldBackups();
  } catch (error) {
    logger.error('[Cron Backup] Critical error', error);
  }
};

const initBackupCron = () => {
  cron.schedule(
    '* * * * *',
    () => {
      executeDailyBackup();
    },
    {
      scheduled: true,
      timezone: TZ,
    }
  );

  cron.schedule('*/30 * * * *', () => {
    logger.info(`[Cron Health] Backup scheduler alive - ${new Date().toISOString()}`);
  });

  logger.info('[Cron] Auto backup scheduler initialized (minute check).');
};

module.exports = { initBackupCron, executeDailyBackup };
