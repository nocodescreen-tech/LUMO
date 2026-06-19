import { useAuthStore } from '../store/useAuthStore';

/**
 * Currency formatting utilities for LUMO
 * Handles conversion between CDF and USD with proper formatting
 */

/**
 * Format a number with appropriate precision based on magnitude
 */
const formatSmart = (num: number): string => {
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    return (num / 1_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'B';
  } else if (abs >= 1_000_000) {
    return (num / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'M';
  } else if (abs >= 1_000) {
    return (num / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'K';
  } else {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
};

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
  if (!Number.isFinite(rate) || rate <= 0) return amount;
  if (fromDevise === 'USD' && toDevise === 'CDF') return Math.round(amount * rate);
  if (fromDevise === 'CDF' && toDevise === 'USD') return Math.round((amount / rate) * 100) / 100;
  return amount;
};

/**
 * Get display values with both main and converted amounts
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

  const normalized = normalizeAmount(rawAmount, deviseOrigin, displayCurrency, exchangeRate);
  const altCurrency = displayCurrency === 'CDF' ? 'USD' : 'CDF';
  const altAmount = normalizeAmount(rawAmount, deviseOrigin, altCurrency, exchangeRate);

  return {
    main: `${formatSmart(normalized)} ${displayCurrency}`,
    sub: `${formatSmart(altAmount)} ${altCurrency}`,
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
  return `${formatSmart(converted)} ${displayCurrency}`;
};

export const useCurrency = () => {
  const { user } = useAuthStore();
  const displayCurrency = (user as any)?.preferences?.currency || 'CDF';
  const exchangeRate = Number((user as any)?.preferences?.exchangeRate || 0);

  const convert = (amount: number, fromDevise: string = 'CDF') => {
    return normalizeAmount(amount, fromDevise, displayCurrency, exchangeRate);
  };

  const format = (amount: number, currency?: string) => {
    const curr = currency || displayCurrency;
    return `${formatSmart(amount)} ${curr}`;
  };

  return { displayCurrency, exchangeRate, convert, format };
};
