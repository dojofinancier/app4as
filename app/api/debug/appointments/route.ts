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
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        email: userEmail 
      }, { status: 404 })
    }

    // Get all appointments for this user
    const appointments = await prisma.appointment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: { id: true, titleFr: true, slug: true }
        },
        tutor: {
          select: { 
            id: true, 
            displayName: true,
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        orderItem: {
          select: { 
            id: true, 
            unitPriceCad: true, 
            lineTotalCad: true,
            order: {
              select: { id: true, status: true, stripePaymentIntentId: true }
            }
          }
        }
      },
      orderBy: { startDatetime: 'desc' }
    })

    // Get all orders for this user
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            course: { select: { titleFr: true } },
            tutor: { select: { displayName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get all webhook events (to see if payment was processed)
    const webhookEvents = await prisma.webhookEvent.findMany({
      where: {
        payloadJson: {
          contains: user.id
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      user,
      appointments: appointments.map(apt => ({
        id: apt.id,
        startDatetime: apt.startDatetime.toISOString(),
        endDatetime: apt.endDatetime.toISOString(),
        status: apt.status,
        course: apt.course,
        tutor: apt.tutor,
        orderItem: apt.orderItem ? {
          id: apt.orderItem.id,
          unitPriceCad: Number(apt.orderItem.unitPriceCad),
          lineTotalCad: Number(apt.orderItem.lineTotalCad),
          order: apt.orderItem.order
        } : null
      })),
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        subtotalCad: Number(order.subtotalCad),
        totalCad: Number(order.totalCad),
        stripePaymentIntentId: order.stripePaymentIntentId,
        createdAt: order.createdAt.toISOString(),
        orderItems: order.items.map(item => ({
          id: item.id,
          course: item.course,
          tutor: item.tutor,
          startDatetime: item.startDatetime.toISOString(),
          durationMin: item.durationMin,
          unitPriceCad: Number(item.unitPriceCad),
          lineTotalCad: Number(item.lineTotalCad)
        }))
      })),
      webhookEvents: webhookEvents.map(event => ({
        id: event.id,
        type: event.type,
        source: event.source,
        createdAt: event.createdAt.toISOString(),
        payload: JSON.parse(event.payloadJson)
      })),
      summary: {
        totalAppointments: appointments.length,
        totalOrders: orders.length,
        totalWebhookEvents: webhookEvents.length
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
