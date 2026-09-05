/**
 * Date Formatter Utility - DD/MM/YYYY Standardizer
 * 
 * Standardizes date display across the entire application and website to DD/MM/YYYY format
 * (e.g., 15/06/2026, 04/09/2026).
 * 
 * Safely parses ISO date strings (YYYY-MM-DD) without timezone shifts,
 * and handles Date objects, timestamps, and period ranges.
 */

/**
 * Formats any date input (YYYY-MM-DD, ISO string, Date object) to DD/MM/YYYY.
 * Returns fallback (default '—') if invalid or empty.
 */
export function formatDateDMY(dateInput?: string | Date | null, fallback = '—'): string {
  if (!dateInput) return fallback;

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return fallback;

    // Already in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Handles YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss (Timezone-safe string extraction)
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }

    // Handles DD-MM-YYYY format
    const matchDMY = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (matchDMY) {
      const [, day, month, year] = matchDMY;
      return `${day}/${month}/${year}`;
    }

    // Fallback parsing with Date object
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return trimmed;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return fallback;
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return fallback;
}

/**
 * Formats a date with time to DD/MM/YYYY, hh:mm A
 */
export function formatDateTimeDMY(dateInput?: string | Date | null, fallback = '—'): string {
  if (!dateInput) return fallback;
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return formatDateDMY(dateInput, fallback);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Formats a billing period range (e.g. "2026-09-01 to 2026-09-30" or "Sep 2026")
 * into DD/MM/YYYY range if dates are present.
 */
export function formatPeriodDMY(period?: string | null): string {
  if (!period) return '—';
  if (period.includes(' to ')) {
    const parts = period.split(' to ');
    if (parts.length === 2) {
      return `${formatDateDMY(parts[0])} to ${formatDateDMY(parts[1])}`;
    }
  }
  return period;
}
