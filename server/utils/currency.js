/**
 * Utilitaire de conversion de devises pour LUMO
 */

/**
 * Convertit un montant d'une devise à une autre
 * @param {number} amount - Le montant à convertir
 * @param {string} from - Devise source ('USD' ou 'CDF')
 * @param {string} to - Devise cible ('USD' ou 'CDF')
 * @param {number} rate - Taux de change (combien de CDF pour 1 USD)
 * @returns {number} Montant converti
 */
const convertCurrency = (amount, from, to, rate) => {
    if (from === to) return amount;
    if (from === 'USD' && to === 'CDF') {
        return amount * rate;
    }
    if (from === 'CDF' && to === 'USD') {
        return amount / rate;
    }
    return amount;
};

/**
 * Formate un montant avec sa devise
 */
const formatCurrency = (amount, devise) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: devise === 'CDF' ? 'CDF' : 'USD',
        minimumFractionDigits: devise === 'CDF' ? 0 : 2
    }).format(amount);
};

module.exports = { convertCurrency, formatCurrency };
