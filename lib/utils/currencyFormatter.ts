/**
 * Formats a monetary number into standard Indian Currency format (INR / ₹)
 * using the Indian numbering system (e.g. ₹1,50,000 or ₹9,000).
 */
export function formatINR(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(num)) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

/**
 * Formats a monetary amount with optional decimal precision (e.g. ₹9,000.50)
 */
export function formatINRExact(amount: number | string | undefined | null, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
