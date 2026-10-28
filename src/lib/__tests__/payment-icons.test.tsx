import { describe, expect, it } from 'bun:test';
import { renderToString } from 'react-dom/server';
import {
  AfterpayIcon,
  AmexIcon,
  ApplePayIcon,
  BankTransferIcon,
  EftposIcon,
  GooglePayIcon,
  KlarnaIcon,
  MastercardIcon,
  PaymentMethodStrip,
  VisaIcon,
  ZipIcon,
} from '@/components/checkout/PaymentIcons';

describe('PaymentIcons', () => {
  it('renders all individual payment icons with proper accessible roles and labels', () => {
    const icons = [
      { component: <VisaIcon />, label: 'Visa' },
      { component: <MastercardIcon />, label: 'Mastercard' },
      { component: <AmexIcon />, label: 'Amex' },
      { component: <ApplePayIcon />, label: 'Apple Pay' },
      { component: <GooglePayIcon />, label: 'Google Pay' },
      { component: <AfterpayIcon />, label: 'Afterpay' },
      { component: <KlarnaIcon />, label: 'Klarna' },
      { component: <ZipIcon />, label: 'Zip' },
      { component: <BankTransferIcon />, label: 'NZ Bank Transfer' },
      { component: <EftposIcon />, label: 'EFTPOS' },
    ];

    for (const { component, label } of icons) {
      const html = renderToString(component);
      expect(html).toContain('role="img"');
      expect(html).toContain(`aria-label="${label}"`);
    }
  });

  it('renders PaymentMethodStrip with standard digital wallets and cards by default', () => {
    const html = renderToString(<PaymentMethodStrip />);
    expect(html).toContain('aria-label="Visa"');
    expect(html).toContain('aria-label="Mastercard"');
    expect(html).toContain('aria-label="Apple Pay"');
    expect(html).toContain('aria-label="Afterpay"');
    expect(html).toContain('aria-label="Zip"');
    expect(html).not.toContain('aria-label="NZ Bank Transfer"');
    expect(html).not.toContain('aria-label="EFTPOS"');
  });

  it('renders PaymentMethodStrip with NZ Bank Transfer and EFTPOS when showBankAndEftpos is true', () => {
    const html = renderToString(<PaymentMethodStrip showBankAndEftpos={true} />);
    expect(html).toContain('aria-label="Visa"');
    expect(html).toContain('aria-label="NZ Bank Transfer"');
    expect(html).toContain('aria-label="EFTPOS"');
  });
});
