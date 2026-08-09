import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Hono } from 'jsr:@hono/hono'
import { cors } from 'jsr:@hono/hono/cors'
import { HTTPException } from 'jsr:@hono/hono/http-exception'
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { getStripeShippingOptions } from '../../../src/config/shipping.ts'

// ---------------------------------------------------------------------------
// Stripe client (module-level — reused across invocations)
// ---------------------------------------------------------------------------
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // @ts-ignore - acacia is a valid API version
  apiVersion: '2025-02-24.acacia',
})

// ---------------------------------------------------------------------------
// Hono app
// ---------------------------------------------------------------------------
const app = new Hono()

// CORS middleware — replaces the manual corsHeaders spreading
app.use(
  '/*',
  cors({
    origin: Deno.env.get('APP_URL') || '*',
    allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
    allowMethods: ['POST', 'OPTIONS'],
  })
)

app.post('/', async (c) => {
  const body = await c.req.json<{
    items: { id: number; name: string; price: number; quantity: number }[]
    promoCode?: string
  }>()

  const { items, promoCode } = body

  if (!items || items.length === 0) {
    throw new HTTPException(400, { message: 'Cart is empty' })
  }

  // Service role client for price validation
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Resolve authenticated user from JWT (optional)
  let userEmail: string | undefined
  let userId: string | undefined
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await anonClient.auth.getUser()
    userEmail = user?.email
    userId = user?.id
  }

  // Handle promo code
  let stripeDiscounts: { coupon: string }[] = []
  if (promoCode) {
    const { data: couponData } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .single()

    if (!couponData) {
      throw new HTTPException(400, { message: 'Invalid promo code' })
    }

    const isPercent = couponData.discount_type === 'percent'
    const stripeCoupon = await stripe.coupons.create({
      ...(isPercent
        ? { percent_off: couponData.amount }
        : { amount_off: Math.round(couponData.amount * 100), currency: 'nzd' }),
      duration: 'once',
      name: couponData.code,
    })
    stripeDiscounts = [{ coupon: stripeCoupon.id }]
  }

  // Validate cart items against DB prices (prevents price tampering)
  const productIds = items.map((i) => i.id)
  const { data: dbProducts, error: dbError } = await supabase
    .from('products')
    .select('id, stripe_price_id, price')
    .in('id', productIds)

  if (dbError || !dbProducts) {
    throw new HTTPException(500, { message: 'Failed to validate cart items' })
  }

  const line_items = items.map((item) => {
    const dbProduct = dbProducts.find((p) => p.id === item.id)

    if (!dbProduct?.stripe_price_id) {
      const serverPrice = dbProduct?.price ?? item.price
      return {
        price_data: {
          currency: 'nzd',
          product_data: { name: item.name },
          unit_amount: Math.round(serverPrice * 100),
        },
        quantity: item.quantity,
      }
    }

    return {
      price: dbProduct.stripe_price_id,
      quantity: item.quantity,
    }
  })

  const appUrl = Deno.env.get('APP_URL') || 'https://catch-22-next.vercel.app'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'link'],
    line_items,
    mode: 'payment',
    currency: 'nzd',
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: { userId: userId || 'guest' },
    discounts: stripeDiscounts.length > 0 ? stripeDiscounts : undefined,
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/cart`,
    billing_address_collection: 'required',
    shipping_address_collection: { allowed_countries: ['NZ'] },
    shipping_options: getStripeShippingOptions(),
  })

  return c.json({ sessionId: session.id, url: session.url })
})

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  const message = err instanceof Error ? err.message : 'Unknown error'
  console.error('Checkout error:', message)
  return c.json({ error: 'Checkout failed. Please try again.' }, 500)
})

Deno.serve(app.fetch)
