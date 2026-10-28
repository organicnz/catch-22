export interface DeliveryEstimate {
  /** Minimum whole business days from dispatch. */
  min: number;
  /** Maximum whole business days from dispatch. */
  max: number;
}

export interface ShippingRate {
  id: string;
  name: string;
  amount: number; // in cents
  currency: string;
  displayPrice: string;
  stripeDisplayName?: string;
  /** Shown on Stripe Checkout and in the cart summary. Omitted for pickup. */
  deliveryEstimate?: DeliveryEstimate;
  /** Human-readable estimate, e.g. "2–4 business days". */
  displayEstimate?: string;
}

export const SHIPPING_RATES: ShippingRate[] = [
  {
    id: 'standard',
    name: 'Standard (non-rural) tracked postage',
    amount: 800, // in cents
    currency: 'nzd',
    displayPrice: '$8.00',
    deliveryEstimate: { min: 2, max: 4 },
    displayEstimate: '2–4 business days',
  },
  {
    id: 'rural',
    name: 'Rural tracked postage',
    amount: 1400,
    currency: 'nzd',
    displayPrice: '$14.00',
    deliveryEstimate: { min: 3, max: 5 },
    displayEstimate: '3–5 business days',
  },
  {
    id: 'standard-courier',
    name: 'Standard (non-rural) tracked courier',
    amount: 1000,
    currency: 'nzd',
    displayPrice: '$10.00',
    deliveryEstimate: { min: 1, max: 2 },
    displayEstimate: '1–2 business days',
  },
  {
    id: 'rural-courier',
    name: 'Rural tracked courier',
    amount: 1500,
    currency: 'nzd',
    displayPrice: '$15.00',
    deliveryEstimate: { min: 2, max: 4 },
    displayEstimate: '2–4 business days',
  },
  {
    id: 'pickup',
    name: 'Pick-up by appointment (Chatswood, North Shore)',
    amount: 0,
    currency: 'nzd',
    displayPrice: 'No cost',
    stripeDisplayName: 'Pick-up by appointment from Chatswood (North Shore Auckland)',
    displayEstimate: 'Ready for collection — we email you a time',
  },
];

function toStripeDeliveryEstimate(estimate: DeliveryEstimate) {
  return {
    minimum: { unit: 'business_day' as const, value: estimate.min },
    maximum: { unit: 'business_day' as const, value: estimate.max },
  };
}

export function getStripeShippingOptions(preferredRateId?: string) {
  const rates = [...SHIPPING_RATES];
  if (preferredRateId) {
    const preferredIndex = rates.findIndex((r) => r.id === preferredRateId);
    if (preferredIndex > 0) {
      const [preferred] = rates.splice(preferredIndex, 1);
      rates.unshift(preferred);
    }
  }

  return rates.map((rate) => ({
    shipping_rate_data: {
      type: 'fixed_amount' as const,
      fixed_amount: { amount: rate.amount, currency: rate.currency },
      display_name: rate.stripeDisplayName || rate.name,
      ...(rate.deliveryEstimate
        ? { delivery_estimate: toStripeDeliveryEstimate(rate.deliveryEstimate) }
        : {}),
    },
  }));
}
