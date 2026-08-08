import { useAuthStore } from '../store/useAuthStore';

/**
 * Currency formatting utilities for LUMO
 * Handles conversion between CDF and USD with proper formatting
 */

/**
 * Format a number with appropriate precision based on magnitude
 */
const formatSmart = (num: number): string => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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

/**
 * Taux de change effectif — source unique pour toute l'application.
 * Priorité : préférences utilisateur → fallback 2800 (taux RDC standard).
 * JAMAIS 0 — si 0, la conversion est ignorée et le prix affiché est faux.
 */
export const getEffectiveRate = (): number => {
  try {
    const state = useAuthStore.getState();
    const rate = Number(state.exchangeRate);
    return rate > 0 ? rate : 2800;
  } catch {
    return 2800;
  }
};

export const useCurrency = () => {
  const { user } = useAuthStore();
  const displayCurrency = (user as any)?.preferences?.currency || 'CDF';
  const exchangeRate = getEffectiveRate();

  const convert = (amount: number, fromDevise: string = 'CDF') => {
    return normalizeAmount(amount, fromDevise, displayCurrency, exchangeRate);
  };

  const format = (amount: number, currency?: string) => {
    const curr = currency || displayCurrency;
    return `${formatSmart(amount)} ${curr}`;
  };

  return { displayCurrency, exchangeRate, convert, format };
};
