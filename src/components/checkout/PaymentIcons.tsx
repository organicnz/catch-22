'use client';

/**
 * Payment method brand icons rendered as clean inline SVGs.
 * No external images — zero network requests, instant paint, print-safe.
 */

/** Visa — official proportions, blue-to-navy gradient. */
export function VisaIcon({ className = 'w-10 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="Visa" role="img">
      <rect width="780" height="500" rx="40" fill="#1A1F71" />
      <path
        d="M293.2 348.7l33.4-195.8h53.3l-33.3 195.8zM524.5 156.3c-10.5-4-27-8.3-47.6-8.3-52.4 0-89.3 26.3-89.6 64-.3 27.9 26.3 43.5 46.4 52.8 20.6 9.5 27.5 15.6 27.4 24.1-.1 13-16.4 18.9-31.6 18.9-21.1 0-32.4-2.9-49.7-10.2l-6.8-3.1-7.4 43.3c12.3 5.4 35.2 10.1 58.9 10.3 55.8 0 92-26 92.4-66.2.2-22.1-13.9-38.9-44.4-52.8-18.5-9-29.8-15-29.7-24.1 0-8.1 9.6-16.7 30.3-16.7 17.3-.3 29.9 3.5 39.7 7.4l4.7 2.2 7.2-41.5zM661.6 152.9h-41c-12.7 0-22.2 3.5-27.8 16.2l-78.8 178h55.7s9.1-24 11.2-29.2h68.1c1.6 6.8 6.5 29.2 6.5 29.2h49.3l-43.2-194.2zm-65.4 125.4c4.4-11.2 21.2-54.3 21.2-54.3-.3.5 4.4-11.3 7.1-18.6l3.6 16.8s10.2 46.6 12.3 56.1h-44.2zM232.8 152.9l-52 133.4-5.5-27c-9.7-31-39.8-64.6-73.5-81.4l47.5 169.5h56.2l83.5-194.5h-56.2z"
        fill="#fff"
      />
      <path
        d="M131.9 152.9H46.8l-.7 3.8c66.6 16.1 110.6 55 128.9 101.7l-18.6-89.4c-3.2-12.3-12.6-15.7-24.5-16.1z"
        fill="#F9A533"
      />
    </svg>
  );
}

/** Mastercard — overlapping red/orange circles. */
export function MastercardIcon({ className = 'w-10 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="Mastercard" role="img">
      <rect width="780" height="500" rx="40" fill="#16366F" />
      <circle cx="310" cy="250" r="150" fill="#EB001B" />
      <circle cx="470" cy="250" r="150" fill="#F79E1B" />
      <path
        d="M390 126.6a149.3 149.3 0 00-55.6 123.4A149.3 149.3 0 00390 373.4a149.3 149.3 0 0055.6-123.4A149.3 149.3 0 00390 126.6z"
        fill="#FF5F00"
      />
    </svg>
  );
}

/** Amex — simplified blue box with centred "AMEX" text. */
export function AmexIcon({ className = 'w-10 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="Amex" role="img">
      <rect width="780" height="500" rx="40" fill="#2E77BC" />
      <text
        x="390"
        y="290"
        textAnchor="middle"
        fontFamily="Arial,sans-serif"
        fontSize="180"
        fontWeight="900"
        fill="#fff"
        letterSpacing="8"
      >
        AMEX
      </text>
    </svg>
  );
}

/** Afterpay — mint-green pill with wordmark. */
export function AfterpayIcon({ className = 'w-16 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} aria-label="Afterpay" role="img">
      <rect width="200" height="60" rx="12" fill="#B2FCE4" />
      <text
        x="100"
        y="40"
        textAnchor="middle"
        fontFamily="-apple-system,BlinkMacSystemFont,sans-serif"
        fontSize="22"
        fontWeight="900"
        fill="#1a1a1a"
        letterSpacing="-0.5"
      >
        afterpay
      </text>
    </svg>
  );
}

/** Klarna — pink pill with wordmark. */
export function KlarnaIcon({ className = 'w-14 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 60" className={className} aria-label="Klarna" role="img">
      <rect width="180" height="60" rx="12" fill="#FFB3C7" />
      <text
        x="90"
        y="40"
        textAnchor="middle"
        fontFamily="-apple-system,BlinkMacSystemFont,sans-serif"
        fontSize="22"
        fontWeight="900"
        fill="#17120F"
        letterSpacing="-0.5"
      >
        Klarna
      </text>
    </svg>
  );
}

/** Zip (formerly PartPay) — NZ Buy Now Pay Later brand icon. */
export function ZipIcon({ className = 'w-12 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 60" className={className} aria-label="Zip" role="img">
      <rect width="180" height="60" rx="12" fill="#241B44" />
      <g fill="#AA8CFF">
        <text
          x="90"
          y="41"
          textAnchor="middle"
          fontFamily="Arial,Helvetica,sans-serif"
          fontSize="30"
          fontWeight="900"
          fill="#FFFFFF"
          letterSpacing="-1"
        >
          zip
        </text>
        <circle cx="130" cy="23" r="4.5" fill="#AA8CFF" />
      </g>
    </svg>
  );
}

/** Apple Pay — dark pill. */
export function ApplePayIcon({ className = 'w-12 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 165 100" className={className} aria-label="Apple Pay" role="img">
      <rect width="165" height="100" rx="15" fill="#000" />
      <g fill="#fff">
        <path d="M41 27.6c-2.5 3-6.5 5.3-10.5 5-0.5-4 1.5-8.2 3.8-10.8 2.5-3 6.8-5.2 10.3-5.3 0.4 4.1-1.3 8.2-3.6 11.1zm3.5 5.6c-5.8-0.3-10.7 3.3-13.4 3.3s-7-3.1-11.5-3c-5.9 0.1-11.4 3.4-14.4 8.7-6.2 10.6-1.6 26.3 4.4 34.9 2.9 4.3 6.4 9 11 8.8 4.4-0.2 6-2.8 11.3-2.8s6.8 2.8 11.4 2.7c4.7-0.1 7.8-4.3 10.7-8.6 3.3-4.9 4.7-9.7 4.8-9.9-0.1-0.1-9.2-3.5-9.3-14-0.1-8.8 7.2-13 7.5-13.2-4.1-6-10.5-6.7-12.5-6.9z" />
        <path d="M88.3 19.3v60.2h9.3V55.1h12.9c11.8 0 20.1-8.1 20.1-19.9s-8.2-15.9-19.7-15.9zm9.3 8h10.7c8.1 0 12.7 4.3 12.7 11.9s-4.6 11.9-12.8 11.9H97.6z" />
        <path d="M138.8 80.1c5.8 0 11.2-3 13.6-7.7h0.2v7.2h8.6V48.6c0-8.7-6.9-14.2-17.6-14.2-9.8 0-17.1 5.6-17.4 13.3h8.4c1.1-3.7 4.5-6.1 8.7-6.1 5.6 0 8.8 2.6 8.8 7.5v3.3l-11.5 0.7c-10.7 0.6-16.5 5-16.5 12.6 0 7.8 6.2 12.9 14.7 12.9v1.5zm2.5-7c-4.9 0-8-2.3-8-5.9 0-3.7 3-5.9 8.7-6.2l10.2-0.6v3.4c0 5.4-4.6 9.3-10.9 9.3z" />
      </g>
    </svg>
  );
}

/** Google Pay — white pill with "G" mark. */
export function GooglePayIcon({ className = 'w-12 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 165 100" className={className} aria-label="Google Pay" role="img">
      <rect width="165" height="100" rx="15" fill="#fff" stroke="#ddd" strokeWidth="2" />
      <g transform="translate(20,22) scale(0.55)">
        <path
          d="M113.8 50.2H82.7v17.5h17.8c-1.6 8.5-8.9 14.9-17.8 14.9-10.8 0-19.6-8.8-19.6-19.6s8.8-19.6 19.6-19.6c4.8 0 9.2 1.7 12.6 4.6l12.8-12.8C101.7 29.2 93 25.5 82.7 25.5 61 25.5 43.4 43.1 43.4 64.8S61 104.1 82.7 104.1c22.6 0 37.5-15.9 37.5-38.3 0-3-0.3-5.3-0.7-7.2l-5.7-8.4z"
          fill="#4285F4"
        />
        <path
          d="M43.4 64.8c0-3.7 0.6-7.2 1.6-10.5l-15-11.6c-3.6 7-5.6 14.8-5.6 22.9s2 15.9 5.6 22.9l15-11.6c-1-3.8-1.6-7.8-1.6-12.1z"
          fill="#FBBC05"
        />
        <path
          d="M82.7 104.1c10 0 18.3-3.3 24.4-9l-14.3-11.1c-3.1 2.2-7.1 3.5-11.6 3.5-10.7 0-19.7-7.2-22.9-17l-15 11.6c6.9 13.6 21 22.9 36.4 22.9v0.1z"
          fill="#34A853"
        />
        <path
          d="M82.7 25.5c-15.4 0-29.5 9.3-36.4 22.9l15 11.6c3.2-9.8 12.2-17 22.9-17 5.8 0 11.1 2.1 15.3 5.6l12.8-12.8C105.2 29.5 95.1 25.5 82.7 25.5z"
          fill="#EA4335"
        />
      </g>
      <text
        x="108"
        y="64"
        fontFamily="-apple-system,sans-serif"
        fontSize="30"
        fontWeight="500"
        fill="#3C4043"
      >
        Pay
      </text>
    </svg>
  );
}

/** NZ Bank Transfer — direct deposit emblem for NZ banks. */
export function BankTransferIcon({ className = 'w-10 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="NZ Bank Transfer" role="img">
      <rect width="780" height="500" rx="40" fill="#0A472E" stroke="#D1FF00" strokeWidth="20" />
      <g fill="#D1FF00">
        {/* Classical bank pillars / pediment icon */}
        <polygon points="170,160 390,70 610,160" />
        <rect x="200" y="180" width="60" height="150" rx="6" />
        <rect x="360" y="180" width="60" height="150" rx="6" />
        <rect x="520" y="180" width="60" height="150" rx="6" />
        <rect x="150" y="340" width="480" height="30" rx="6" />
      </g>
      <text
        x="390"
        y="440"
        textAnchor="middle"
        fontFamily="-apple-system,BlinkMacSystemFont,sans-serif"
        fontSize="75"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="8"
      >
        NZ BANK
      </text>
    </svg>
  );
}

/** EFTPOS — New Zealand debit / payment terminal badge. */
export function EftposIcon({ className = 'w-10 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="EFTPOS" role="img">
      <rect width="780" height="500" rx="40" fill="#0F172A" stroke="#334155" strokeWidth="16" />
      <rect x="40" y="40" width="700" height="420" rx="24" fill="#007A3D" />
      <text
        x="390"
        y="300"
        textAnchor="middle"
        fontFamily="Arial,Helvetica,sans-serif"
        fontSize="170"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="10"
      >
        EFTPOS
      </text>
      <text
        x="390"
        y="380"
        textAnchor="middle"
        fontFamily="-apple-system,BlinkMacSystemFont,sans-serif"
        fontSize="50"
        fontWeight="800"
        fill="#D1FF00"
        letterSpacing="4"
      >
        NEW ZEALAND
      </text>
    </svg>
  );
}

/** Compact row of accepted payment method icons for trust signals. */
export function PaymentMethodStrip({
  className = '',
  showBankAndEftpos = false,
  showZip = true,
}: {
  className?: string;
  showBankAndEftpos?: boolean;
  showZip?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <VisaIcon className="w-9 h-6 rounded" />
      <MastercardIcon className="w-9 h-6 rounded" />
      <AmexIcon className="w-9 h-6 rounded" />
      <ApplePayIcon className="w-11 h-6 rounded" />
      <GooglePayIcon className="w-11 h-6 rounded" />
      <AfterpayIcon className="w-14 h-6 rounded" />
      <KlarnaIcon className="w-12 h-6 rounded" />
      {showZip && <ZipIcon className="w-11 h-6 rounded" />}
      {showBankAndEftpos && (
        <>
          <BankTransferIcon className="w-10 h-6 rounded" />
          <EftposIcon className="w-10 h-6 rounded" />
        </>
      )}
    </div>
  );
}
