/**
 * Script de réinitialisation du mot de passe superadmin
 * Usage: node scripts/reset-password.js
 * 
 * Met à jour directement le hash bcrypt dans la DB sans passer par le hook
 * (utile quand le hash est corrompu par double-hashage)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const NEW_PASSWORD = 'Admin1234!'; // Change ce mot de passe selon tes besoins

async function resetPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connecté à la base de données');

    // Générer un nouveau hash propre
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(NEW_PASSWORD, salt);
    
    console.log(`🔑 Nouveau hash généré pour le mot de passe: ${NEW_PASSWORD}`);

    // Mettre à jour directement via SQL brut (bypass du hook beforeSave)
    const [updatedRows] = await sequelize.query(
      `UPDATE "Users" SET "motDePasse" = :hash WHERE role = 'superadmin' RETURNING id, nom, email`,
      {
        replacements: { hash: newHash },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    if (updatedRows && updatedRows.length > 0) {
      console.log('✅ Mot de passe réinitialisé avec succès pour:');
      updatedRows.forEach(u => console.log(`   - ${u.nom} (${u.email})`));
      console.log(`\n🔑 Nouveau mot de passe: ${NEW_PASSWORD}`);
      console.log('⚠️  Change-le immédiatement après ta première connexion!');
    } else {
      console.log('⚠️  Aucun superadmin trouvé. Vérifie ta base de données.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

resetPassword();
