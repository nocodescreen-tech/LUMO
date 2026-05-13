const { sequelize } = require('./config/database');
const logger = require('./utils/logger');

async function fixDatabase() {
  try {
    logger.info('Connexion à la base de données...');
    await sequelize.authenticate();
    
    logger.info('Ajout de la colonne twoFactorSecret...');
    // Cette commande ajoute la colonne seulement si elle n'existe pas
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "twoFactorSecret" VARCHAR(255);');
    
    logger.info('✅ Base de données mise à jour avec succès !');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur lors de la mise à jour :', error.message);
    process.exit(1);
  }
}

fixDatabase();
