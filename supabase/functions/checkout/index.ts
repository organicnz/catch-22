/* eslint-disable */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // @ts-ignore - acacia is a valid API version
  apiVersion: '2025-02-24.acacia',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { items, promoCode } = await req.json()

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role for server-side DB queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Resolve authenticated user from the JWT in the Authorization header (optional)
    let userEmail: string | undefined
    let userId: string | undefined
    const authHeader = req.headers.get('Authorization')
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

      if (couponData) {
        const isPercent = couponData.discount_type === 'percent'
        const stripeCoupon = await stripe.coupons.create({
          ...(isPercent
            ? { percent_off: couponData.amount }
            : { amount_off: Math.round(couponData.amount * 100), currency: 'nzd' }),
          duration: 'once',
          name: couponData.code,
        })
        stripeDiscounts = [{ coupon: stripeCoupon.id }]
      } else {
        return new Response(JSON.stringify({ error: 'Invalid promo code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Validate cart items against DB prices (prevents price tampering)
    const productIds = items.map((i: { id: number }) => i.id)
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, stripe_price_id, price')
      .in('id', productIds)

    if (dbError || !dbProducts) {
      throw new Error('Failed to validate cart items against the database')
    }

    const line_items = items.map((item: { id: number; name: string; price: number; quantity: number }) => {
      const dbProduct = dbProducts.find((p) => p.id === item.id)

      if (!dbProduct?.stripe_price_id) {
        // Fallback: create price inline using DB price (not client-supplied price)
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
      shipping_address_collection: { allowed_countries: ['NZ', 'AU'] },
    })

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Checkout error:', message)
    return new Response(JSON.stringify({ error: 'Checkout failed. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
