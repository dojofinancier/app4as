import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'API is working' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ 
      message: 'POST is working',
      receivedData: body,
      envCheck: {
        stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
        stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7)
      }
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ error: 'Test API error' }, { status: 500 })
  }
}

