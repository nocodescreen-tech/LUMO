const admin = require('firebase-admin');
const logger = require('../utils/logger');
const {stat}=require('fs/promises');
const safeFilename=/^lumo-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.json$/i;

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

const uploadBackup = async (filePath, fileName, ownerId) => {
    if (!bucket||!Number.isSafeInteger(ownerId)||ownerId<=0||typeof fileName!=='string'||!safeFilename.test(fileName)) return false;

    try {
        const info=await stat(filePath);if(!info.isFile()||info.size<=0||info.size>8*1024*1024)return false;
        await bucket.upload(filePath, {
            destination: `backups/${ownerId}/${fileName}`,
            validation: 'crc32c',
            preconditionOpts:{ifGenerationMatch:0},
            metadata: {
                contentType: 'application/octet-stream',
                cacheControl: 'private, no-store',
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
