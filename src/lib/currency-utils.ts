/**
 * Currency utilities for handling cents/dollars conversion consistently
 * All database amounts are stored in cents for precision
 */

/**
 * Convert dollars to cents for database storage
 * @param dollars Amount in dollars (e.g., 19.99)
 * @returns Amount in cents (e.g., 1999)
 */
export const dollarsTooCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

/**
 * Convert cents to dollars for display
 * @param cents Amount in cents (e.g., 1999)
 * @returns Amount in dollars (e.g., 19.99)
 */
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

/**
 * Format cents as currency string for display
 * @param cents Amount in cents (e.g., 1999)
 * @returns Formatted currency string (e.g., "$19.99")
 */
export const formatCurrency = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

/**
 * Validate that amount is in expected cents format
 * @param amount Amount to validate
 * @returns boolean indicating if amount appears to be in cents
 */
export const validateCentsFormat = (amount: number): boolean => {
  // Amounts should be >= 50 cents ($0.50) for valid transactions
  return amount >= 50;
};

/**
 * Calculate session cost in cents
 * @param hourlyRate Tutor's hourly rate in dollars
 * @param durationMinutes Session duration in minutes
 * @returns Session cost in cents
 */
export const calculateSessionCostInCents = (hourlyRate: number, durationMinutes: number): number => {
  const priceInDollars = (hourlyRate / 60) * durationMinutes;
  return dollarsTooCents(priceInDollars);
};