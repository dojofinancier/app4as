import { NextResponse } from 'next/server'
import { getCartSessionId, getOrCreateCartSessionId } from '@/lib/utils/session'

export async function GET() {
  try {
    const existingSessionId = getCartSessionId()
    const newSessionId = getOrCreateCartSessionId()
    
    return NextResponse.json({
      existingSessionId,
      newSessionId,
      cookies: process.env.NODE_ENV === 'development' ? 'Debug info available' : 'Hidden in production'
    })
  } catch (error) {
    console.error('Error getting session info:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

