/**
 * Currency formatting utilities for HubCommerce
 * Handles conversion between CDF and USD with proper formatting
 */

/**
 * Normalize a currency value to a target currency
 */
export const normalizeAmount = (
  amount: number,
  fromDevise: string,
  toDevise: string,
  rate: number
): number => {
  if (!amount || !fromDevise || !toDevise || fromDevise === toDevise) return amount;
  if (fromDevise === 'USD' && toDevise === 'CDF') return Math.round(amount * rate);
  if (fromDevise === 'CDF' && toDevise === 'USD') return Math.round((amount / rate) * 100) / 100;
  return amount;
};

/**
 * Get display values with both main and converted amounts
 * @param rawAmount - the raw amount from DB
 * @param deviseOrigin - the currency of the raw amount (e.g., 'USD', 'CDF')
 * @param displayCurrency - the user's preferred display currency
 * @param exchangeRate - current exchange rate (1 USD = X CDF)
 */
export const getDisplayAmount = (
  rawAmount: number,
  deviseOrigin: string,
  displayCurrency: string,
  exchangeRate: number
): { main: string; sub: string; mainDevise: string; subDevise: string } => {
  if (!rawAmount) {
    return {
      main: `0 ${displayCurrency}`,
      sub: `0 ${displayCurrency === 'CDF' ? 'USD' : 'CDF'}`,
      mainDevise: displayCurrency,
      subDevise: displayCurrency === 'CDF' ? 'USD' : 'CDF'
    };
  }

  // Normalize to display currency
  const normalized = normalizeAmount(rawAmount, deviseOrigin, displayCurrency, exchangeRate);
  const altCurrency = displayCurrency === 'CDF' ? 'USD' : 'CDF';

  // Also get the equivalent in alternate currency
  const altAmount = normalizeAmount(rawAmount, deviseOrigin, altCurrency, exchangeRate);

  return {
    main: `${Number(normalized).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${displayCurrency}`,
    sub: `${Number(altAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${altCurrency}`,
    mainDevise: displayCurrency,
    subDevise: altCurrency
  };
};

/**
 * Format a single amount in the target currency
 */
export const formatMontant = (
  montant: number,
  deviseOrigin: string,
  displayCurrency: string,
  exchangeRate: number
): string => {
  const converted = normalizeAmount(montant, deviseOrigin, displayCurrency, exchangeRate);
  return `${Number(converted).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${displayCurrency}`;
};