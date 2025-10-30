import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true, 
        role: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        email: userEmail 
      }, { status: 404 })
    }

    // Get appointment count for this user
    const appointmentCount = await prisma.appointment.count({
      where: { userId: user.id }
    })

    // Get order count for this user
    const orderCount = await prisma.order.count({
      where: { userId: user.id }
    })

    return NextResponse.json({
      user,
      appointmentCount,
      orderCount,
      message: `Found user ${user.firstName} ${user.lastName} (${user.email}) with ${appointmentCount} appointments and ${orderCount} orders`
    })

  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
