import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Hono } from 'jsr:@hono/hono'
import { HTTPException } from 'jsr:@hono/hono/http-exception'
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

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

app.post('/', async (c) => {
  const body = await c.req.text()
  const signature = c.req.header('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    throw new HTTPException(500, { message: 'Webhook secret not configured' })
  }

  if (!signature) {
    throw new HTTPException(400, { message: 'Missing stripe-signature header' })
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    throw new HTTPException(400, { message: `Webhook Error: ${message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Resolve customer profile
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

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        status: 'processing',
        total_amount: (session.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || 'NZD',
        payment_method: 'stripe_link',
        billing_address: session.customer_details?.address || {},
        shipping_address: shippingAddress,
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('Error inserting order:', orderError.message)
      throw new HTTPException(500, { message: 'Database fulfillment failed' })
    }

    console.log(`Order fulfilled for session: ${session.id}`)

    // Decrement inventory
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

    // Send admin notification
    await sendAdminOrderNotification(session, lineItems.data, order?.id ?? null)
  }

  return c.json({ received: true })
})

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error('Unhandled webhook error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

Deno.serve(app.fetch)

// ---------------------------------------------------------------------------
// Admin order notification email
// ---------------------------------------------------------------------------
async function sendAdminOrderNotification(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.LineItem[],
  orderId: number | null
) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set — skipping order notification email')
    return
  }

  const adminEmail = Deno.env.get('ADMIN_ORDER_EMAIL') || 'orders@catch-22.co.nz'
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'orders@catch-22.co.nz'
  const customer = session.customer_details
  const totalNZD = ((session.amount_total || 0) / 100).toFixed(2)

  const shippingAddr =
    (session as Stripe.Checkout.Session & {
      shipping_details?: { address?: Record<string, string> }
    }).shipping_details?.address || customer?.address

  const addressLine = shippingAddr
    ? [
        shippingAddr.line1,
        shippingAddr.line2,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.postal_code,
        shippingAddr.country,
      ]
        .filter(Boolean)
        .join(', ')
    : 'Not provided'

  const itemRows = lineItems
    .map((item) => {
      const name = item.description || 'Unknown item'
      const qty = item.quantity || 1
      const itemTotal = ((item.amount_total || 0) / 100).toFixed(2)
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(209,255,0,0.15);color:#fff;font-size:14px;">${name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(209,255,0,0.15);color:#fff;font-size:14px;text-align:center;">${qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(209,255,0,0.15);color:#D1FF00;font-size:14px;text-align:right;">$${itemTotal}</td>
        </tr>`
    })
    .join('')

  const orderLabel = orderId ? `#${orderId}` : session.id.slice(-8).toUpperCase()

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0A472E;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(209,255,0,0.2);">
            <img src="https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/wp-content/uploads/2021/10/logo.png" alt="Catch-22" width="160" style="display:block;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 4px;color:#D1FF00;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;">New Order Received</h1>
            <h2 style="margin:0 0 24px;color:#fff;font-size:22px;font-weight:900;">Order ${orderLabel} — $${totalNZD} NZD</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:rgba(0,0,0,0.25);border-radius:8px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 8px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">Customer</p>
                <p style="margin:0 0 4px;color:#fff;font-size:14px;">${customer?.name || 'Guest'}</p>
                <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:13px;">${customer?.email || 'No email'}</p>
                <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">${customer?.phone || ''}</p>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:rgba(0,0,0,0.25);border-radius:8px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 8px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">Ship To</p>
                <p style="margin:0;color:#fff;font-size:14px;line-height:1.6;">${addressLine}</p>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:rgba(0,0,0,0.25);border-radius:8px;">
              <tr>
                <td style="padding:12px 12px 4px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">Item</td>
                <td style="padding:12px 12px 4px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;text-align:center;">Qty</td>
                <td style="padding:12px 12px 4px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;text-align:right;">Total</td>
              </tr>
              ${itemRows}
              <tr>
                <td colspan="2" style="padding:12px;color:rgba(255,255,255,0.6);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Order Total</td>
                <td style="padding:12px;color:#D1FF00;font-size:16px;font-weight:900;text-align:right;">$${totalNZD} NZD</td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center">
                <a href="https://dashboard.stripe.com/payments/${session.payment_intent || ''}" style="display:inline-block;background:#D1FF00;color:#0A472E;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;text-decoration:none;padding:14px 32px;border-radius:9999px;">View in Stripe Dashboard</a>
              </td></tr>
            </table>
            <p style="margin:20px 0 0;color:rgba(255,255,255,0.3);font-size:11px;text-align:center;">Session: ${session.id}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(209,255,0,0.2);text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.15em;">Catch-22 &middot; Premium Fishing Gear &middot; New Zealand</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: adminEmail,
      subject: `🎣 New Order ${orderLabel} — $${totalNZD} NZD from ${customer?.name || 'Guest'}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Failed to send order notification email:', err)
  } else {
    console.log(`Order notification sent to ${adminEmail} for order ${orderLabel}`)
  }
}
