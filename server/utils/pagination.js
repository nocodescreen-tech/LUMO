/**
 * Calcule les paramètres de pagination pour Sequelize
 * @param {number|string} page - Le numéro de la page
 * @param {number|string} limit - Le nombre d'éléments par page
 * @returns {Object} { limit, offset }
 */
const getPagination = (page, limit) => {
    const l = limit ? +limit : 10;
    const p = page ? +page : 1;
    const offset = (p - 1) * l;
    return { limit: l, offset };
};

/**
 * Formate les données de pagination pour la réponse API
 * @param {Object} data - Les données retournées par findAndCountAll
 * @param {number} page - La page actuelle
 * @param {number} limit - La limite par page
 * @returns {Object} { totalItems, items, totalPages, currentPage }
 */
const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: items } = data;
    const currentPage = page ? +page : 1;
    const totalPages = Math.ceil(totalItems / (limit || 10));
    return { 
        data: items, 
        pagination: {
            total: totalItems,
            page: currentPage,
            limit: limit || 10,
            pages: totalPages
        }
    };
};

module.exports = { getPagination, getPagingData };
