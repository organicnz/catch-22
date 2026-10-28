/**
 * New Zealand Inland Revenue (IRD) / GST number validation and formatting.
 *
 * Implements the official Inland Revenue Modulus 11 check-digit algorithm
 * with primary and secondary weighting passes for 8-digit and 9-digit
 * business GST and tax numbers.
 */

export interface NZGstValidationResult {
  isValid: boolean;
  isChecksumValid: boolean;
  formatted: string;
  digits: string;
  error?: string;
}

const PRIMARY_WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2];
const SECONDARY_WEIGHTS = [7, 4, 3, 2, 5, 2, 7, 6];

/**
 * Validates an 8 or 9 digit NZ IRD / GST number using the official Modulus 11 algorithm.
 */
export function verifyNZIRDChecksum(digits: string): boolean {
  if (digits.length !== 8 && digits.length !== 9) {
    return false;
  }

  const checkDigit = Number.parseInt(digits.slice(-1), 10);
  const baseDigitsRaw = digits.slice(0, -1);

  // Left pad 7-digit base to 8 digits with a leading 0
  const baseDigitsStr = baseDigitsRaw.padStart(8, '0');
  const baseDigits = baseDigitsStr.split('').map((ch) => Number.parseInt(ch, 10));

  // Range validation: base number must fall within 10,000,000 and 200,000,000
  const baseNumber = Number.parseInt(baseDigitsStr, 10);
  if (baseNumber < 1000000 || baseNumber > 200000000) {
    return false;
  }

  // Pass 1: Primary Weights [3, 2, 7, 6, 5, 4, 3, 2]
  let sum1 = 0;
  for (let i = 0; i < 8; i++) {
    sum1 += baseDigits[i] * PRIMARY_WEIGHTS[i];
  }

  const remainder1 = sum1 % 11;
  const calcCheck1 = remainder1 === 0 ? 0 : 11 - remainder1;

  if (calcCheck1 < 10) {
    return calcCheck1 === checkDigit;
  }

  // Pass 2: Secondary Weights [7, 4, 3, 2, 5, 2, 7, 6]
  let sum2 = 0;
  for (let i = 0; i < 8; i++) {
    sum2 += baseDigits[i] * SECONDARY_WEIGHTS[i];
  }

  const remainder2 = sum2 % 11;
  const calcCheck2 = remainder2 === 0 ? 0 : 11 - remainder2;

  if (calcCheck2 === 10) {
    return false;
  }

  return calcCheck2 === checkDigit;
}

/**
 * Formats a raw string into standard NZ GST representation (XX-XXX-XXX or XXX-XXX-XXX).
 */
export function formatNZGstNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  // 9 digits: XXX-XXX-XXX
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Validates user-entered NZ GST number, returning friendly status and formatted string.
 */
export function validateNZGstNumber(raw: string): NZGstValidationResult {
  const digits = raw.replace(/\D/g, '');

  if (!digits) {
    return {
      isValid: false,
      isChecksumValid: false,
      formatted: '',
      digits: '',
      error: 'Please enter a GST number',
    };
  }

  if (digits.length < 8) {
    return {
      isValid: false,
      isChecksumValid: false,
      formatted: formatNZGstNumber(digits),
      digits,
      error: 'NZ GST numbers must be 8 or 9 digits',
    };
  }

  if (digits.length > 9) {
    return {
      isValid: false,
      isChecksumValid: false,
      formatted: formatNZGstNumber(digits),
      digits,
      error: 'NZ GST numbers cannot exceed 9 digits',
    };
  }

  const isChecksumValid = verifyNZIRDChecksum(digits);
  const formatted = formatNZGstNumber(digits);

  return {
    isValid: true,
    isChecksumValid,
    formatted,
    digits,
    error: isChecksumValid
      ? undefined
      : 'Check digit mismatch — please verify with your IRD details',
  };
}
