import { NextResponse } from 'next/server'
import { getOrCreateCartByIdentity } from '@/lib/actions/cart'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateCartSessionId } from '@/lib/utils/session'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Authenticated users use user.id; guests use session cookie
    if (user) {
      const cart = await getOrCreateCartByIdentity({ userId: user.id })
      return NextResponse.json({ cart })
    }

    const sessionId = getOrCreateCartSessionId()
    const cart = await getOrCreateCartByIdentity({ sessionId })

    return NextResponse.json({ cart })
  } catch (error) {
    console.error('Error getting cart:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
