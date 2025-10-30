import { NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/actions/checkout'

export async function POST() {
  try {
    const result = await createPaymentIntent()
    
    return NextResponse.json({
      success: result.success,
      error: result.error,
      hasClientSecret: !!result.clientSecret,
      hasPaymentIntentId: !!result.paymentIntentId
    })
  } catch (error) {
    console.error('Error testing payment intent creation:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

