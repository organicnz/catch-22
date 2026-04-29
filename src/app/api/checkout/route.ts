import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          link: {
            enabled: true,
          },
        },
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
