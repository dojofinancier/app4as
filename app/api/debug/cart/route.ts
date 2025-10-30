import { NextResponse } from 'next/server'
import { getCartSessionId } from '@/lib/utils/session'
import { getOrCreateCartByIdentity } from '@/lib/actions/cart'

export async function GET() {
  try {
    const sessionId = await getCartSessionId()
    
    if (!sessionId) {
      return NextResponse.json({
        sessionId: null,
        cart: null,
        error: 'No session ID found'
      })
    }
    
    const cart = await getOrCreateCartByIdentity({ sessionId })
    
    return NextResponse.json({
      sessionId,
      cart: {
        id: cart.id,
        userId: cart.userId,
        sessionId: cart.sessionId,
        itemsCount: cart.items.length,
        items: cart.items.map(item => ({
          id: item.id,
          courseId: item.courseId,
          tutorId: item.tutorId,
          startDatetime: item.startDatetime,
          durationMin: item.durationMin,
          unitPriceCad: item.unitPriceCad,
          lineTotalCad: item.lineTotalCad
        }))
      }
    })
  } catch (error) {
    console.error('Error getting cart info:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

