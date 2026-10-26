/**
 * Bank-transfer (direct deposit) details shown to customers once they place
 * an order.
 *
 * These values are NOT secrets — every customer choosing this payment method
 * sees them. They live in env vars so the account can be updated in Vercel
 * without a code change.
 *
 * In production, missing configuration means the checkout refuses to create
 * an order: showing a placeholder account number to a paying customer would
 * be worse than being offline. In development a clearly-labelled test account
 * is used so the whole flow can be exercised locally.
 */

export interface BankTransferDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string[];
  /** True when placeholder details are being used (development only). */
  testMode: boolean;
}

export type BankTransferConfig =
  | { configured: true; details: BankTransferDetails }
  | { configured: false; missing: string[] };

const PRODUCTION_REQUIRED = [
  'BANK_TRANSFER_BANK_NAME',
  'BANK_TRANSFER_ACCOUNT_NAME',
  'BANK_TRANSFER_ACCOUNT_NUMBER',
] as const;

export function getBankTransferConfig(): BankTransferConfig {
  const bankName = process.env.BANK_TRANSFER_BANK_NAME?.trim() ?? '';
  const accountName = process.env.BANK_TRANSFER_ACCOUNT_NAME?.trim() ?? '';
  const accountNumber = process.env.BANK_TRANSFER_ACCOUNT_NUMBER?.trim() ?? '';

  const missing = PRODUCTION_REQUIRED.filter((name) => {
    if (name === 'BANK_TRANSFER_BANK_NAME') return !bankName;
    if (name === 'BANK_TRANSFER_ACCOUNT_NAME') return !accountName;
    return !accountNumber;
  });

  if (missing.length > 0) {
    // Never surface a fake account in production — an order paid into a
    // placeholder account is money lost.
    if (process.env.NODE_ENV === 'production') {
      return { configured: false, missing: [...missing] };
    }

    return {
      configured: true,
      details: {
        bankName: 'TEST MODE — no real bank configured',
        accountName: 'Catch-22 (test order — do not pay)',
        accountNumber: '00-0000-0000000-00',
        instructions: [
          'This is a test order — no payment is required.',
          'Set BANK_TRANSFER_BANK_NAME, BANK_TRANSFER_ACCOUNT_NAME and BANK_TRANSFER_ACCOUNT_NUMBER to show real details.',
          'Your order is packed once the payment clears — usually within one business day.',
          'We will email you when your order is on its way.',
        ],
        testMode: true,
      },
    };
  }

  return {
    configured: true,
    details: {
      bankName,
      accountName,
      accountNumber,
      instructions: [
        'Pay the exact total using internet banking or at any branch.',
        'Put your order reference in the bank payment reference field.',
        'Your order is packed once the payment clears — usually within one business day.',
        'We will email you when your order is on its way.',
      ],
      testMode: false,
    },
  };
}
