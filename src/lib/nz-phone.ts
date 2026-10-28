/**
 * New Zealand telephone number normalization and classification helpers.
 *
 * Supports NZ mobile prefixes (020, 021, 022, 027, 028, 029) and standard
 * regional landline area codes (03, 04, 06, 07, 09), handling +64 country code,
 * spaces, dashes, and local notation.
 */

export interface NZPhoneClassification {
  isValid: boolean;
  type: 'mobile' | 'landline' | 'toll-free' | 'unknown';
  formatted: string;
  region?: string;
  carrier?: string;
}

/**
 * Strips non-digit characters, handling +64 or 64 country code prefix.
 * Normalizes to standard 0-prefixed NZ local format.
 */
export function cleanNZPhone(raw: string): string {
  let cleaned = raw.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+64')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('64') && cleaned.length >= 10) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Remove any remaining non-digits
  return cleaned.replace(/\D/g, '');
}

/**
 * Classifies and formats a New Zealand phone number.
 */
export function classifyNZPhone(raw: string): NZPhoneClassification {
  const digits = cleanNZPhone(raw);

  if (!digits || digits.length < 7) {
    return {
      isValid: false,
      type: 'unknown',
      formatted: raw.trim(),
    };
  }

  // Mobile prefixes: 020, 021, 022, 027, 028, 029
  if (/^02[0-2,7-9]/.test(digits)) {
    const isNineDigit = digits.length === 9;
    const isTenDigit = digits.length === 10;
    const isElevenDigit = digits.length === 11;

    let formatted = digits;
    if (isNineDigit) {
      // 021 123 456
      formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else if (isTenDigit) {
      // 021 123 4567 or 0274 123 456
      if (digits.startsWith('0274') || digits.startsWith('0210')) {
        formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      } else {
        formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      }
    } else if (isElevenDigit) {
      formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }

    let carrier = 'NZ Mobile';
    if (digits.startsWith('021')) carrier = 'One NZ / Spark Mobile';
    else if (digits.startsWith('022')) carrier = '2degrees Mobile';
    else if (digits.startsWith('027')) carrier = 'Spark Mobile';

    return {
      isValid: digits.length >= 9 && digits.length <= 11,
      type: 'mobile',
      formatted,
      carrier,
    };
  }

  // Toll free: 0800, 0508
  if (digits.startsWith('0800') || digits.startsWith('0508')) {
    const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`.trim();
    return {
      isValid: digits.length >= 9 && digits.length <= 10,
      type: 'toll-free',
      formatted,
      region: 'NZ Toll Free',
    };
  }

  // Regional landlines: 09, 07, 06, 04, 03
  const landlineArea = digits.slice(0, 2);
  const landlineMap: Record<string, string> = {
    '09': 'Auckland & Northland',
    '07': 'Waikato & Bay of Plenty',
    '06': 'Central / Hawke’s Bay / Taranaki',
    '04': 'Wellington & Kāpiti',
    '03': 'South Island',
  };

  if (landlineArea in landlineMap) {
    const formatted =
      digits.length === 9
        ? `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
        : digits;

    return {
      isValid: digits.length === 9,
      type: 'landline',
      formatted,
      region: landlineMap[landlineArea],
    };
  }

  return {
    isValid: digits.length >= 8 && digits.length <= 11,
    type: 'unknown',
    formatted: digits,
  };
}

/**
 * Formats a phone string into standard NZ spaced representation.
 */
export function formatNZPhone(raw: string): string {
  const result = classifyNZPhone(raw);
  return result.formatted;
}
