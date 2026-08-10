import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });

const ep = await stripe.webhookEndpoints.update('we_1U2KPDE2L5MFpsl773LgmYfs', {
  enabled_events: [
    'checkout.session.completed',
    'checkout.session.expired',
    'payment_intent.payment_failed',
    'charge.refunded',
  ],
});
console.log('endpoint', ep.id, ep.url);
console.log('events:', ep.enabled_events.join(', '));