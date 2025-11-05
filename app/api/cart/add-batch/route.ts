import { NextRequest, NextResponse } from 'next/server'
import { addToCartBatch } from '@/lib/actions/cart'
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
    const { courseId, courseStudentRateCad, sessions } = body

    // Validate required fields
    if (!courseId || courseStudentRateCad === undefined || !Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    // Validate each session
    for (const session of sessions) {
      if (!session.tutorId || !session.startDatetime || !session.durationMin) {
        return NextResponse.json(
          { error: 'Chaque session doit avoir un tuteur, une date de début et une durée' },
          { status: 400 }
        )
      }

      // Validate duration
      if (![60, 90, 120].includes(session.durationMin)) {
        return NextResponse.json(
          { error: 'Durée invalide. Doit être 60, 90 ou 120 minutes' },
          { status: 400 }
        )
      }
    }

    // Add to cart batch (supports guest session carts)
    const result = await addToCartBatch({
      courseId,
      courseStudentRateCad: Number(courseStudentRateCad),
      sessions: sessions.map(session => ({
        tutorId: session.tutorId,
        startDatetime: new Date(session.startDatetime),
        durationMin: session.durationMin as 60 | 90 | 120,
      })),
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      added: result.added,
      skipped: result.skipped,
    })
  } catch (error) {
    console.error('Error adding to cart batch:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

