const { User } = require('./models');
const { sequelize } = require('./config/database');

async function clearUsers() {
    try {
        await User.destroy({ where: {}, truncate: true, cascade: true });
        console.log('✅ Tous les utilisateurs ont été supprimés. Vous pouvez créer votre compte SuperAdmin.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

clearUsers();
