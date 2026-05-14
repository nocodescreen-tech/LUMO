const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

// Only initialize if we have the config
let bucket = null;

try {
    // You should put your serviceAccountKey.json in server/config/
    const serviceAccountPath = path.join(__dirname, '..', 'config', 'lumo-58279-firebase-adminsdk-fbsvc-33532c1e1a.json');
    
    let serviceAccount;
    
    // Priorité à la variable d'environnement (plus sécurisé pour la prod)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
            // Si c'est du base64
            serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString());
        }
    } else if (require('fs').existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });

        bucket = admin.storage().bucket();
        logger.info('✅ Firebase Storage initialisé.');
    } else {
        logger.warn('⚠️ Firebase config non trouvée (Variable d\'env ou JSON).');
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
