import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // @ts-ignore - acacia is a valid API version
  apiVersion: '2025-02-24.acacia',
})

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return new Response(JSON.stringify({ error: `Webhook Error: ${message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Use service role to bypass RLS for order fulfillment
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Resolve customer ID from metadata or email lookup
    let customerId: string | null =
      session.metadata?.userId && session.metadata.userId !== 'guest'
        ? session.metadata.userId
        : null

    if (!customerId && session.customer_details?.email) {
      const { data: customer } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', session.customer_details.email)
        .single()
      customerId = customer?.id || null
    }

    const shippingAddress =
      (session as Stripe.Checkout.Session & {
        shipping_details?: { address?: Record<string, unknown> }
      }).shipping_details?.address || {}

    const { error: orderError } = await supabase.from('orders').insert({
      customer_id: customerId,
      status: 'processing',
      total_amount: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase() || 'NZD',
      payment_method: 'stripe_link',
      billing_address: session.customer_details?.address || {},
      shipping_address: shippingAddress,
    })

    if (orderError) {
      console.error('Error inserting order:', orderError.message)
      return new Response(JSON.stringify({ error: 'Database fulfillment failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Order fulfilled for session: ${session.id}`)

    // Decrement inventory for each purchased item
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

    for (const item of lineItems.data) {
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('stripe_price_id', item.price?.id)
        .single()

      if (product) {
        await supabase.rpc('decrement_stock', {
          p_id: product.id,
          decrement_by: item.quantity || 1,
        })
        console.log(`Decremented stock for product ${product.id}`)
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
