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
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        email: userEmail 
      }, { status: 404 })
    }

    // Get appointments using the same query as getStudentAppointments
    const appointments = await prisma.appointment.findMany({
      where: { userId: user.id },
      include: {
        course: true,
        tutor: {
          include: {
            user: true
          }
        },
        orderItem: true,
        modifications: {
          include: {
            modifier: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { startDatetime: 'asc' }
    })

    // Get orders
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      appointments: appointments.map(apt => ({
        id: apt.id,
        startDatetime: apt.startDatetime.toISOString(),
        endDatetime: apt.endDatetime.toISOString(),
        status: apt.status,
        course: {
          id: apt.course.id,
          titleFr: apt.course.titleFr,
          slug: apt.course.slug
        },
        tutor: {
          id: apt.tutor.id,
          displayName: apt.tutor.displayName,
          user: {
            id: apt.tutor.user.id,
            firstName: apt.tutor.user.firstName,
            lastName: apt.tutor.user.lastName,
            email: apt.tutor.user.email
          }
        },
        orderItem: apt.orderItem ? {
          id: apt.orderItem.id,
          unitPriceCad: Number(apt.orderItem.unitPriceCad),
          lineTotalCad: Number(apt.orderItem.lineTotalCad)
        } : null,
        modifications: apt.modifications.map(mod => ({
          id: mod.id,
          modificationType: mod.modificationType,
          reason: mod.reason,
          createdAt: mod.createdAt?.toISOString() || new Date().toISOString(),
          modifier: mod.modifier
        }))
      })),
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        subtotalCad: Number(order.subtotalCad),
        totalCad: Number(order.totalCad),
        stripePaymentIntentId: order.stripePaymentIntentId,
        createdAt: order.createdAt.toISOString()
      })),
      summary: {
        totalAppointments: appointments.length,
        totalOrders: orders.length
      }
    })

  } catch (error) {
    console.error('Error fetching appointment data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
