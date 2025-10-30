import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'unknown'
      } : null,
      error: error?.message || null,
      hasUser: !!user,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking auth state:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}