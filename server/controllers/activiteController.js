const { Activite, User } = require('../models');

/**
 * Log an activity to the database or console
 * @param {number} userId 
 * @param {string} type - Action type (e.g. 'CONNEXION', 'INSCRIPTION')
 * @param {string} details 
 * @param {string} source - 'System' or IP address
 * @param {number} shopId - The tenant/shop ID
 */
const logActivite = async (userId, type, details, source, shopId = null, userNom = null) => {
    try {
        console.log(`[ACTIVITY] ${type} | ${details} | User: ${userId} | Source: ${source}`);
        
        // Optimisation : Si le nom est fourni, on évite une requête SQL coûteuse
        let finalUserNom = userNom || 'Système';
        if (!userNom && userId) {
            const user = await User.findByPk(userId, { attributes: ['nom'] });
            if (user) finalUserNom = user.nom;
        }
        
        // On ne 'await' pas obligatoirement si on veut de la performance pure, 
        // mais ici on le garde car c'est une fonction utilitaire. 
        // C'est l'appelant qui décidera de ne pas attendre.
        await Activite.create({
            type,
            description: details,
            userNom: finalUserNom,
            source,
            UserId: userId || null,
            shopId: shopId || null
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

module.exports = { logActivite };
