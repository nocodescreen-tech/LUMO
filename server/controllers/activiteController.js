/**
 * Log an activity to the database or console
 * @param {number} userId 
 * @param {string} type - Action type (e.g. 'CONNEXION', 'INSCRIPTION')
 * @param {string} details 
 * @param {string} source - 'System' or IP address
 */
const logActivite = async (userId, type, details, source) => {
    try {
        console.log(`[ACTIVITY] User ${userId} | ${type} | ${details} | Source: ${source}`);
        // For now, we just log to console. 
        // Later we can add an Activite model and save to DB.
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

module.exports = { logActivite };
