import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('=== WEBHOOK TEST ENDPOINT HIT ===')
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
    const body = await req.text()
    console.log('Body length:', body.length)
    console.log('Body preview:', body.substring(0, 200))
    
    return NextResponse.json({ 
      received: true, 
      timestamp: new Date().toISOString(),
      bodyLength: body.length 
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
