import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateTutorEarnings } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json()
    
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 })
    }

    // Get payment intent data
    const paymentIntentData = await prisma.paymentIntentData.findUnique({
      where: { paymentIntentId }
    })

    if (!paymentIntentData) {
      return NextResponse.json({ error: 'Payment intent data not found' }, { status: 404 })
    }

    // Parse cart data
    const cartData = JSON.parse(paymentIntentData.cartData)
    const userId = paymentIntentData.userId

    if (!userId || userId.startsWith('guest_')) {
      return NextResponse.json({ error: 'This endpoint is for logged-in users only' }, { status: 400 })
    }

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId: userId,
          subtotalCad: cartData.items.reduce((sum: number, item: any) => sum + item.lineTotalCad, 0),
          discountCad: cartData.discountAmount || 0,
          totalCad: cartData.items.reduce((sum: number, item: any) => sum + item.lineTotalCad, 0) - (cartData.discountAmount || 0),
          status: 'paid',
          stripePaymentIntentId: paymentIntentId,
        }
      })

      // Create order items and appointments
      const orderItems = []
      const appointments = []

      for (const item of cartData.items) {
        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            courseId: item.courseId,
            tutorId: item.tutorId,
            startDatetime: new Date(item.startDatetime),
            endDatetime: new Date(new Date(item.startDatetime).getTime() + item.durationMin * 60000),
            durationMin: item.durationMin,
            unitPriceCad: item.unitPriceCad,
            lineTotalCad: item.lineTotalCad,
            tutorEarningsCad: item.tutorEarningsCad
          }
        })

        orderItems.push(orderItem)

        // Check if appointment already exists (idempotency)
        const existingAppointment = await tx.appointment.findFirst({
          where: {
            orderItemId: orderItem.id
          }
        })

        if (!existingAppointment) {
          // Create the appointment
          const appointment = await tx.appointment.create({
            data: {
              userId: userId,
              tutorId: item.tutorId,
              courseId: item.courseId,
              startDatetime: new Date(item.startDatetime),
              endDatetime: new Date(new Date(item.startDatetime).getTime() + item.durationMin * 60000),
              status: 'scheduled',
              orderItemId: orderItem.id
            }
          })

          appointments.push(appointment)
        }
      }

      // Delete all holds for this cart
      await tx.slotHold.deleteMany({
        where: {
          userId: userId,
          tutorId: { in: cartData.items.map((item: any) => item.tutorId) },
          startDatetime: { in: cartData.items.map((item: any) => new Date(item.startDatetime)) }
        }
      })

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cartData.id || '' }
      })

      // Clean up payment intent data
      await tx.paymentIntentData.delete({
        where: { paymentIntentId }
      })

      return { order, orderItems, appointments }
    })

    return NextResponse.json({ 
      success: true, 
      orderId: result.order.id,
      appointmentsCreated: result.appointments.length,
      message: 'Appointments created successfully'
    })

  } catch (error) {
    console.error('Error processing payment intent:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
