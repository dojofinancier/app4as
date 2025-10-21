import { NextRequest, NextResponse } from 'next/server'
import { bookingSessionManager } from '@/lib/booking-session'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, updates } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID de session manquant' },
        { status: 400 }
      )
    }

    const success = bookingSessionManager.updateSession(sessionId, updates)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Session expirée ou introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating booking session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la session' },
      { status: 500 }
    )
  }
}

