/**
 * New Zealand postcode and regional courier transit time helpers.
 *
 * Maps standard 4-digit NZ Post postcodes to administrative regions,
 * islands (North vs. South Island), and standard courier delivery windows
 * dispatched from Catch-22's Auckland facility.
 */

export interface NZDeliveryEstimate {
  region: string;
  island: 'North Island' | 'South Island';
  transitDays: string;
  summary: string;
}

/**
 * Infers the New Zealand region from a 4-digit postcode.
 * Returns null if the postcode is invalid or unmapped.
 */
export function inferNZRegion(rawPostcode: string): string | null {
  const digits = rawPostcode.trim().replace(/\D/g, '');
  if (digits.length !== 4) return null;

  const code = Number.parseInt(digits, 10);
  if (Number.isNaN(code)) return null;

  // Northland
  if (code >= 100 && code <= 599) return 'Northland';

  // Auckland (0600–2699)
  if (code >= 600 && code <= 2699) return 'Auckland';

  // Waikato & Bay of Plenty
  if (code >= 3000 && code <= 3199) return 'Bay of Plenty';
  if (code >= 3200 && code <= 3999) return 'Waikato';

  // Central North Island & East Coast
  if (code >= 4000 && code <= 4099) return 'Gisborne';
  if (code >= 4100 && code <= 4299) return "Hawke's Bay";
  if (code >= 4300 && code <= 4399) return 'Taranaki';
  if (code >= 4400 && code <= 4999) return 'Manawatū-Whanganui';

  // Wellington Region
  if (code >= 5000 && code <= 6999) return 'Wellington';

  // Upper South Island & West Coast
  if (code >= 7000 && code <= 7199) return 'Nelson';
  if (code >= 7200 && code <= 7399) return 'Marlborough';
  if (code >= 7400 && code <= 7799) return 'Canterbury';
  if (code >= 7800 && code <= 7899) return 'West Coast';

  // Canterbury
  if (code >= 8000 && code <= 8999) return 'Canterbury';

  // Otago & Southland
  if (code >= 9000 && code <= 9599) return 'Otago';
  if (code >= 9600 && code <= 9899) return 'Southland';

  return null;
}

/**
 * Calculates estimated tracked delivery time from Auckland to destination.
 */
export function getNZDeliveryEstimate(
  rawPostcode: string,
  isRural = false
): NZDeliveryEstimate | null {
  const region = inferNZRegion(rawPostcode);
  if (!region) return null;

  const isAuckland = region === 'Auckland';
  const isSouthIsland = [
    'Nelson',
    'Tasman',
    'Marlborough',
    'West Coast',
    'Canterbury',
    'Otago',
    'Southland',
  ].includes(region);

  const island = isSouthIsland ? 'South Island' : 'North Island';

  let transitDays: string;
  if (isAuckland) {
    transitDays = isRural ? '2–3 business days' : '1–2 business days';
  } else if (!isSouthIsland) {
    // Rest of North Island
    transitDays = isRural ? '3–4 business days' : '2–3 business days';
  } else {
    // South Island
    transitDays = isRural ? '4–5 business days' : '2–4 business days';
  }

  const summary = isAuckland
    ? `Auckland Local (${transitDays})`
    : `${region}, ${island} (${transitDays})`;

  return {
    region,
    island,
    transitDays,
    summary,
  };
}
