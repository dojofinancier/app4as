import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/actions/checkout'
import { validateEnvForRoute } from '@/lib/utils/env-validation'
import { rateLimit } from '@/lib/utils/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests per minute per user/IP
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const rateLimitResponse = rateLimit(request, 'PAYMENT', user?.id)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Validate critical environment variables for payment intent creation
  try {
    validateEnvForRoute(['STRIPE_SECRET_KEY', 'DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'])
  } catch (error) {
    logger.error('Environment validation failed:', error)
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const result = await createPaymentIntent()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId
    })
  } catch (error) {
    logger.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

