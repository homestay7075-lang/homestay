/**
 * Standard Indian 10-digit Mobile Number Validator
 * Pattern: phone_pattern = r"^[6-9]\d{9}$"
 * 
 * Enforced across the entire app and website for adding and editing:
 * - Student mobile number & guardian phone
 * - Public booking inquiries
 * - Staff & warden contact phone
 * - Owner profile phone & hostel settings phone
 * - Resident login mobile authentication
 */

export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const PHONE_HTML_PATTERN = "[6-9][0-9]{9}";

export const PHONE_ERROR_MESSAGE =
  'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9 (pattern: ^[6-9]\\d{9}$).';

/**
 * Strips non-digits and removes standard +91 or 91 country code prefix if present.
 */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const digitsOnly = String(phone).replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2);
  }
  return digitsOnly;
}

/**
 * Checks if a given phone number strictly matches `^[6-9]\d{9}$`.
 */
export function isValidPhoneNumber(phone?: string | null): boolean {
  if (!phone) return false;
  const normalized = normalizePhoneNumber(phone);
  return PHONE_REGEX.test(normalized);
}
