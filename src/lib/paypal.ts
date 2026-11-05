/**
 * Thin server-side client for PayPal Orders REST v2.
 *
 * Kept dependency-free (same style as the Resend calls) so the storefront
 * never adds an SDK just to create and capture one NZ payment flow. All
 * functions require the PAYPAL_* environment variables and fail fast when they
 * are missing.
 */

import { env } from '@/lib/env';
import { roundMoney } from '@/lib/bank-transfer-order';

export type PayPalEnvironment = 'sandbox' | 'live';

const BASE_URLS: Record<PayPalEnvironment, string> = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
};

export class PayPalError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'PayPalError';
  }
}

export interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalPayerName {
  given_name?: string;
  surname?: string;
}

export interface PayPalPayer {
  name?: PayPalPayerName;
  email_address?: string;
  payer_id?: string;
}

export interface PayPalShippingAddress {
  address_line_1?: string;
  address_line_2?: string;
  admin_area_2?: string;
  admin_area_1?: string;
  postal_code?: string;
  country_code?: string;
}

export interface PayPalShipping {
  name?: { full_name?: string };
  address?: PayPalShippingAddress;
}

export interface PayPalCapture {
  id: string;
  status?: string;
  amount?: { value?: string; currency_code?: string };
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  invoice_id?: string;
  custom_id?: string;
  amount?: { value?: string; currency_code?: string };
  shipping?: PayPalShipping;
  payments?: { captures?: PayPalCapture[] };
}

export interface PayPalOrder {
  id: string;
  status?: string;
  intent?: string;
  payer?: PayPalPayer;
  purchase_units?: PayPalPurchaseUnit[];
  links?: PayPalLink[];
}

export interface CreatePayPalOrderInput {
  total: number;
  currency?: string;
  invoiceId: string;
  referenceId?: string;
  returnUrl: string;
  cancelUrl: string;
}

function paypalBaseUrl(): string {
  return BASE_URLS[env.PAYPAL_ENV ?? 'sandbox'];
}

/**
 * Pure credential check: values must be present and must not be the
 * scaffold placeholders ("your...") that ship in example configs. Extracted
 * so it can be unit-tested without touching the env snapshot.
 */
export function hasUsablePayPalCredentials(clientId?: string, clientSecret?: string): boolean {
  const id = (clientId ?? '').trim();
  const secret = (clientSecret ?? '').trim();
  if (!id || !secret) return false;
  if (id.toLowerCase().startsWith('your') || secret.toLowerCase().startsWith('your')) {
    return false;
  }
  return true;
}

export function isPayPalConfigured(): boolean {
  return hasUsablePayPalCredentials(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET);
}

async function parseError(res: Response): Promise<never> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => undefined);
  }
  const message =
    typeof body === 'object' && body !== null && 'message' in body
      ? String((body as { message?: unknown }).message)
      : `PayPal request failed (${res.status})`;
  throw new PayPalError(message, res.status, body);
}

async function getAccessToken(): Promise<string> {
  if (!isPayPalConfigured()) {
    throw new PayPalError('PayPal is not configured');
  }
  const basic = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString(
    'base64'
  );
  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) return parseError(res);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new PayPalError('PayPal did not return an access token');
  }
  return data.access_token;
}

export async function createPayPalOrder(input: CreatePayPalOrderInput): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const value = roundMoney(input.total).toFixed(2);
  const res = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.referenceId ?? 'catch22',
          invoice_id: input.invoiceId,
          custom_id: input.referenceId ?? input.invoiceId,
          amount: {
            currency_code: input.currency ?? 'NZD',
            value,
          },
        },
      ],
      application_context: {
        brand_name: 'Catch-22',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        shipping_preference: 'GET_FROM_FILE',
      },
    }),
  });
  if (!res.ok) return parseError(res);
  return (await res.json()) as PayPalOrder;
}

export async function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const res = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return parseError(res);
  return (await res.json()) as PayPalOrder;
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const res = await fetch(
    `${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: '{}',
    }
  );
  if (!res.ok) return parseError(res);
  return (await res.json()) as PayPalOrder;
}

/** Approval URL the customer should be redirected to after order creation. */
export function paypalApproveUrl(order: PayPalOrder): string | null {
  return order.links?.find((link) => link.rel === 'approve')?.href ?? null;
}

export function paypalOrderAmount(
  order: PayPalOrder
): { value: string; currencyCode: string } | null {
  const amount = order.purchase_units?.[0]?.amount;
  if (!amount?.value) return null;
  return { value: amount.value, currencyCode: amount.currency_code ?? 'NZD' };
}

export function paypalCaptureId(order: PayPalOrder): string | null {
  return order.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
}

export function paypalCaptureStatus(order: PayPalOrder): string | null {
  return order.purchase_units?.[0]?.payments?.captures?.[0]?.status ?? null;
}
