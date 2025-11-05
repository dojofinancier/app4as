import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateCartByIdentity } from '@/lib/actions/cart'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateCartSessionId } from '@/lib/utils/session'
import { rateLimit } from '@/lib/utils/rate-limit'

export async function GET(request: NextRequest) {
  // Rate limiting: 60 requests per minute per user/IP
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const rateLimitResponse = rateLimit(request, 'API', user?.id)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Authenticated users use user.id; guests use session cookie
    if (user) {
      const cart = await getOrCreateCartByIdentity({ userId: user.id })
      
      // Convert Decimal fields to numbers for Client Component compatibility
      const serializedCart = {
        ...cart,
        items: cart.items.map(item => ({
          ...item,
          unitPriceCad: Number(item.unitPriceCad),
          lineTotalCad: Number(item.lineTotalCad),
          course: {
            ...item.course,
            studentRateCad: Number(item.course.studentRateCad)
          },
          tutor: {
            ...item.tutor,
            hourlyBaseRateCad: Number(item.tutor.hourlyBaseRateCad)
          }
        }))
      }
      
      return NextResponse.json({ cart: serializedCart })
    }

    // Use same logic as cart creation - try to get existing session ID first
    const { getCartSessionId } = await import('@/lib/utils/session')
    const existingSessionId = await getCartSessionId()
    
    if (!existingSessionId) {
      // No existing session - return empty cart
      return NextResponse.json({ cart: { id: '', items: [], coupon: null } })
    }
    
    const cart = await getOrCreateCartByIdentity({ sessionId: existingSessionId })

    // Convert Decimal fields to numbers for Client Component compatibility
    const serializedCart = {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        unitPriceCad: Number(item.unitPriceCad),
        lineTotalCad: Number(item.lineTotalCad),
        course: {
          ...item.course,
          studentRateCad: Number(item.course.studentRateCad)
        },
        tutor: {
          ...item.tutor,
          hourlyBaseRateCad: Number(item.tutor.hourlyBaseRateCad)
        }
      }))
    }

    return NextResponse.json({ cart: serializedCart })
  } catch (error) {
    console.error('Error getting cart:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
