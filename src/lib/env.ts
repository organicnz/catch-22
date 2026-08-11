import { z } from 'zod';

// Public vars are validated in BOTH environments (they are inlined by Next.js
// into the client bundle). Server-only secrets are added to the schema on the
// server — they are never inlined, so a client import must not reference them.
const isClient = typeof window !== 'undefined';
const skipValidation = process.env.NEXT_SKIP_ENV_VALIDATION === '1';

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://catch-22.co.nz'),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  // Optional at build time — these are only needed by runtime Stripe routes,
  // which validate them explicitly. Keeps preview builds green when the
  // Preview environment has no secrets (production-only env vars).
  STRIPE_SECRET_KEY: z.string().min(1).optional().catch(undefined),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional().catch(undefined),
});

const schema = isClient ? publicSchema : serverSchema;

type EnvValue = z.infer<typeof serverSchema>;

export const env: EnvValue = skipValidation
  ? (process.env as unknown as EnvValue)
  : (schema.parse({ ...process.env }) as EnvValue);
