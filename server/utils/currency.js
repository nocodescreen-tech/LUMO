/**
 * Utilitaire centralisé de conversion de devises pour LUMO (backend)
 * Source unique — utilisé par tous les contrôleurs et modèles.
 */

const FALLBACK_RATE = 2250;

/**
 * Convertit un montant d'une devise à une autre.
 * @param {number} amount - Le montant à convertir
 * @param {string} from - Devise source ('USD', 'CDF', 'FC')
 * @param {string} to - Devise cible ('USD', 'CDF')
 * @param {number} rate - Taux de change (combien de CDF pour 1 USD). Fallback 2250 si absent.
 * @returns {number} Montant converti
 */
const convertCurrency = (amount, from, to, rate) => {
  const safeAmount = Number(amount) || 0;
  const fromNorm = from === 'FC' ? 'CDF' : (from || 'CDF');
  const toNorm = to === 'FC' ? 'CDF' : (to || 'CDF');
  const safeRate = Number(rate) > 0 ? Number(rate) : FALLBACK_RATE;

  if (fromNorm === toNorm) return safeAmount;
  if (fromNorm === 'USD' && toNorm === 'CDF') return Math.round(safeAmount * safeRate);
  if (fromNorm === 'CDF' && toNorm === 'USD') return Math.round((safeAmount / safeRate) * 100) / 100;
  return safeAmount;
};

/**
 * Taux effectif — priorité: rate fourni → fallback 2250.
 */
const getEffectiveRate = (rate) => {
  const safeRate = Number(rate);
  return safeRate > 0 ? safeRate : FALLBACK_RATE;
};

/**
 * Formate un montant avec sa devise
 */
const formatCurrency = (amount, devise) => {
  const d = devise === 'FC' ? 'CDF' : (devise || 'CDF');
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: d === 'CDF' ? 'CDF' : 'USD',
    minimumFractionDigits: d === 'CDF' ? 0 : 2
  }).format(amount);
};

module.exports = { convertCurrency, getEffectiveRate, formatCurrency, FALLBACK_RATE };
