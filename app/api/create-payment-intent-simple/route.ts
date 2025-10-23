import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    console.log('Simple payment intent test...')
    
    const stripe = getStripe()
    const body = await request.json()
    console.log('Request body:', body)
    
    // Create a simple payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00 CAD
      currency: 'cad',
      metadata: {
        test: 'true'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })
    
    console.log('Payment intent created:', paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du paiement', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

