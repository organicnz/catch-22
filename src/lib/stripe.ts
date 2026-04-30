import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export const stripe = new Stripe(stripeSecretKey, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2025-02-24.acacia' as any,
  typescript: true,
})
