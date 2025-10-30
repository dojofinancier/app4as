import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  console.log('=== STRIPE WEBHOOK DEBUG ===')
  
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')
  
  console.log('Signature present:', !!signature)
  console.log('Body length:', body.length)
  console.log('Webhook secret set:', !!process.env.STRIPE_WEBHOOK_SECRET)
  console.log('Webhook secret length:', process.env.STRIPE_WEBHOOK_SECRET?.length || 0)

  if (!signature) {
    console.log('ERROR: No signature header')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('ERROR: No webhook secret in environment')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    console.log('Attempting signature verification...')
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    console.log('Signature verification successful!')
    console.log('Event type:', event.type)
    console.log('Event ID:', event.id)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    console.error('Error details:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log the webhook event
  console.log('=== STRIPE WEBHOOK RECEIVED ===')
  console.log('Event type:', event.type)
  console.log('Event ID:', event.id)

  try {
    await prisma.webhookEvent.create({
      data: {
        source: 'stripe',
        type: event.type,
        payloadJson: JSON.stringify(event.data)
      }
    })
    console.log('Webhook event logged to database')
  } catch (dbError) {
    console.error('Error logging webhook event:', dbError)
  }

  return NextResponse.json({ received: true })
}
