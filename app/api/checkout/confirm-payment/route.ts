import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateEnvForRoute } from '@/lib/utils/env-validation'
import { rateLimit } from '@/lib/utils/rate-limit'
import { getStripe } from '@/lib/stripe'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests per minute per user/IP
  const rateLimitResponse = rateLimit(request, 'PAYMENT')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Validate critical environment variables for payment confirmation
  try {
    validateEnvForRoute(['STRIPE_SECRET_KEY', 'DATABASE_URL'])
  } catch (error) {
    logger.error('Environment validation failed:', error)
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Get the payment intent data from database
    const paymentIntentData = await prisma.paymentIntentData.findUnique({
      where: { paymentIntentId }
    })

    if (!paymentIntentData) {
      return NextResponse.json(
        { error: 'Payment intent data not found' },
        { status: 404 }
      )
    }

    // Verify the payment intent belongs to this user
    if (paymentIntentData.userId !== user.id) {
      return NextResponse.json(
        { error: 'Ce paiement ne vous appartient pas' },
        { status: 403 }
      )
    }

    // Verify payment intent status with Stripe
    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Le paiement n'a pas réussi. Statut: ${paymentIntent.status}` },
        { status: 400 }
      )
    }

    // Check if order already exists (idempotency)
    const existingOrder = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId }
    })

    if (existingOrder) {
      logger.debug('Order already exists for payment intent:', paymentIntentId)
      return NextResponse.json({ 
        success: true, 
        orderId: existingOrder.id,
        message: 'Order already processed'
      })
    }

    // Parse cart data
    const cartData = JSON.parse(paymentIntentData.cartData)
    
    // Get metadata from payment intent
    const {
      cartId,
      couponCode,
      discountAmount
    } = paymentIntent.metadata || {}

    const finalCouponCode = cartData.couponCode || couponCode || ''
    const finalDiscountAmount = cartData.discountAmount || (discountAmount ? parseFloat(discountAmount) : 0)

    if (cartData.items.length === 0) {
      return NextResponse.json(
        { error: 'No items in payment intent data' },
        { status: 400 }
      )
    }

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          subtotalCad: paymentIntent.amount / 100,
          discountCad: finalDiscountAmount,
          totalCad: paymentIntent.amount / 100,
          status: 'paid',
          stripePaymentIntentId: paymentIntent.id,
        }
      })

      // Create order items and appointments
      const orderItems = []
      const appointments = []

      for (const item of cartData.items) {
        // Get tutor's current rate for earnings calculation
        const tutor = await tx.tutor.findUnique({
          where: { id: item.tutorId },
          select: { hourlyBaseRateCad: true }
        })

        if (!tutor) {
          throw new Error(`Tutor not found: ${item.tutorId}`)
        }

        // Calculate tutor earnings
        const tutorEarningsCad = item.tutorEarningsCad || 0
        
        // Calculate hours worked (default to full duration)
        const hoursWorked = item.durationMin / 60
        const rateAtTime = Number(tutor.hourlyBaseRateCad)

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
            tutorEarningsCad: tutorEarningsCad,
            hoursWorked: hoursWorked,
            rateAtTime: rateAtTime,
            earningsStatus: 'scheduled' // Set to 'scheduled' initially - will become 'earned' when appointment is completed
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
              userId: user.id,
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
          userId: user.id,
          tutorId: { in: cartData.items.map((item: any) => item.tutorId) },
          startDatetime: { in: cartData.items.map((item: any) => new Date(item.startDatetime)) }
        }
      })

      // Clear the cart (use cartId from metadata or find cart by userId)
      const cartIdToUse = cartId || (await tx.cart.findFirst({
        where: { userId: user.id },
        select: { id: true }
      }))?.id

      if (cartIdToUse) {
        await tx.cartItem.deleteMany({
          where: { cartId: cartIdToUse }
        })
      }

      // Update coupon redemption count if applicable
      if (finalCouponCode) {
        await tx.coupon.updateMany({
          where: { code: finalCouponCode },
          data: {
            redemptionCount: {
              increment: 1
            }
          }
        })
      }

      // Clean up payment intent data
      await tx.paymentIntentData.delete({
        where: { paymentIntentId }
      })

      return { order, orderItems, appointments }
    })

    // Update Stripe customer ID if not already set
    if (paymentIntent.customer) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: paymentIntent.customer as string }
      })
    }

    // Save payment method if it's a new one
    if (paymentIntent.payment_method) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id }
        })

        if (dbUser && !dbUser.defaultPaymentMethodId) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              defaultPaymentMethodId: paymentIntent.payment_method as string
            }
          })
          logger.debug('Saved new payment method for user:', user.id)
        }
      } catch (error) {
        logger.error('Error saving payment method:', error)
        // Don't fail the request for this
      }
    }

    // Send Make.com webhooks
    try {
      const orderWithDetails = await prisma.order.findUnique({
        where: { id: result.order.id },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          items: {
            include: {
              course: true,
              tutor: {
                include: {
                  user: {
                    select: {
                      email: true,
                      phone: true
                    }
                  }
                }
              },
              appointment: true
            }
          }
        }
      })

      if (orderWithDetails) {
        const { sendBookingCreatedWebhook } = await import('@/lib/webhooks/make')
        
        // Send booking created webhook
        await sendBookingCreatedWebhook({
          orderId: orderWithDetails.id,
          userId: orderWithDetails.userId,
          currency: orderWithDetails.currency || 'CAD',
          subtotalCad: Number(orderWithDetails.subtotalCad),
          discountCad: Number(orderWithDetails.discountCad),
          totalCad: Number(orderWithDetails.totalCad),
          couponCode: finalCouponCode || undefined,
          phone: orderWithDetails.user?.phone || null,
          studentEmail: orderWithDetails.user?.email || '',
          studentFirstName: orderWithDetails.user?.firstName || '',
          studentLastName: orderWithDetails.user?.lastName || '',
          items: orderWithDetails.items.map(item => ({
            appointmentId: item.appointment?.id || '',
            courseId: item.courseId,
            courseTitleFr: item.course.titleFr,
            tutorId: item.tutorId,
            tutorName: item.tutor.displayName,
            tutorEmail: item.tutor.user?.email || '',
            tutorPhone: item.tutor.user?.phone || null,
            startDatetime: item.startDatetime.toISOString(),
            durationMin: item.durationMin,
            priceCad: Number(item.lineTotalCad),
            tutorEarningsCad: Number(item.tutorEarningsCad)
          })),
          createdAt: orderWithDetails.createdAt.toISOString()
        })
      }
    } catch (webhookError) {
      // Don't fail the request if webhook fails
      logger.error('Error sending booking.created webhook:', webhookError)
    }

    return NextResponse.json({ 
      success: true, 
      orderId: result.order.id,
      appointmentsCreated: result.appointments.length
    })

  } catch (error) {
    logger.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

