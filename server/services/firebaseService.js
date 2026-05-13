const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

// Only initialize if we have the config
let bucket = null;

try {
    // You should put your serviceAccountKey.json in server/config/
    const serviceAccountPath = path.join(__dirname, '..', 'config', 'lumo-58279-firebase-adminsdk-fbsvc-33532c1e1a.json');
    
    if (require('fs').existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET // e.g. "lumo-erp.appspot.com"
        });

        bucket = admin.storage().bucket();
        logger.info('✅ Firebase Storage initialisé pour les sauvegardes Cloud.');
    } else {
        logger.warn('⚠️ Firebase service account non trouvé. Les sauvegardes resteront locales uniquement.');
    }
} catch (error) {
    logger.error('❌ Erreur lors de l’initialisation de Firebase Storage:', error);
}

const uploadBackup = async (filePath, fileName) => {
    if (!bucket) return false;

    try {
        await bucket.upload(filePath, {
            destination: `backups/${fileName}`,
            metadata: {
                contentType: 'application/octet-stream',
            },
        });
        logger.info(`✅ Sauvegarde envoyée sur le Cloud : ${fileName}`);
        return true;
    } catch (error) {
        logger.error(`❌ Échec de l’upload Cloud pour ${fileName}:`, error);
        return false;
    }
};

module.exports = { uploadBackup };
