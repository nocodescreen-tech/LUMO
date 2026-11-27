const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Only initialize if we have the config
let bucket = null;

try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try { serviceAccount=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); }
        catch(e){serviceAccount=JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT,'base64').toString());}
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
    logger.error('Firebase Storage initialization failed');
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
        logger.error('Encrypted backup upload failed');
        return false;
    }
};

module.exports = { uploadBackup };
