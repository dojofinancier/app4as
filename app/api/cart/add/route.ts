import { NextRequest, NextResponse } from 'next/server'
import { addToCart } from '@/lib/actions/cart'
import { rateLimit } from '@/lib/utils/rate-limit'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Rate limiting: 60 requests per minute per user/IP
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const rateLimitResponse = rateLimit(request, 'API', user?.id)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { courseId, tutorId, startDatetime, durationMin } = body

    // Validate required fields
    if (!courseId || !tutorId || !startDatetime || !durationMin) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    // Validate duration
    if (![60, 90, 120].includes(durationMin)) {
      return NextResponse.json(
        { error: 'Durée invalide. Doit être 60, 90 ou 120 minutes' },
        { status: 400 }
      )
    }

    // Add to cart (supports guest session carts)
    const result = await addToCart({
      courseId,
      tutorId,
      startDatetime: new Date(startDatetime),
      durationMin: durationMin as 60 | 90 | 120
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
