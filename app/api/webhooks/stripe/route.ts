import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { calculateTutorEarnings } from '@/lib/pricing'

export async function POST(req: NextRequest) {
  console.log('=== STRIPE WEBHOOK RECEIVED ===')
  
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  console.log('Signature present:', !!signature)
  console.log('Body length:', body.length)
  console.log('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET)

  if (!signature) {
    console.log('ERROR: No signature header')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('ERROR: STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    console.log('Attempting signature verification...')
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('Signature verification successful!')
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    console.error('Error details:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log the webhook event
  console.log('Event type:', event.type)
  console.log('Event ID:', event.id)
  console.log('Event data:', JSON.stringify(event.data, null, 2))

  try {
    await prisma.webhookEvent.create({
      data: {
        source: 'stripe',
        type: event.type,
        payloadJson: JSON.stringify(event.data)
      }
    })
    console.log('Webhook event logged to database successfully')
  } catch (dbError) {
    console.error('Error logging webhook event to database:', dbError)
    // Continue processing even if logging fails
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      console.log('=== PROCESSING PAYMENT_INTENT.SUCCEEDED ===')
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      console.log('Payment Intent ID:', paymentIntent.id)
      console.log('Payment Intent metadata:', paymentIntent.metadata)
      
      // Get cart data from database first
      const paymentIntentData = await prisma.paymentIntentData.findUnique({
        where: { paymentIntentId: paymentIntent.id }
      })

      if (!paymentIntentData) {
        console.error('No payment intent data found for:', paymentIntent.id)
        return NextResponse.json({ error: 'Payment intent data not found' }, { status: 400 })
      }

      // Get metadata from the payment intent
      const {
        userId: metadataUserId,
        cartId,
        itemCount,
        couponCode,
        discountAmount
      } = paymentIntent.metadata || {}

      // Use userId from paymentIntentData if available, otherwise fall back to metadata
      const userId = paymentIntentData.userId || metadataUserId

      if (!userId || !cartId) {
        console.error('Missing required userId or cartId:', { 
          userId, 
          cartId, 
          metadataUserId, 
          paymentIntentDataUserId: paymentIntentData.userId,
          paymentIntentMetadata: paymentIntent.metadata 
        })
        return NextResponse.json({ error: 'Missing userId or cartId' }, { status: 400 })
      }

      // Parse cart data
      let cartData: {
        items: Array<{
          courseId: string
          tutorId: string
          startDatetime: string
          durationMin: number
          unitPriceCad: number
          lineTotalCad: number
          tutorEarningsCad: number
        }>
        couponCode: string
        discountAmount: number
      }
      
      try {
        cartData = JSON.parse(paymentIntentData.cartData)
      } catch (error) {
        console.error('Error parsing cart data:', error)
        return NextResponse.json({ error: 'Invalid cart data' }, { status: 400 })
      }

      const cartItems = cartData.items
      const finalCouponCode = cartData.couponCode || couponCode || ''
      const finalDiscountAmount = cartData.discountAmount || (discountAmount ? parseFloat(discountAmount) : 0)

      if (cartItems.length === 0) {
        console.error('No items in payment intent metadata')
        return NextResponse.json({ error: 'No cart items in metadata' }, { status: 400 })
      }

      // Create everything in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the order
        const order = await tx.order.create({
          data: {
            userId: userId,
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

        for (const item of cartItems) {
          // Get tutor's current rate for earnings calculation
          const tutor = await tx.tutor.findUnique({
            where: { id: item.tutorId },
            select: { hourlyBaseRateCad: true }
          })

          if (!tutor) {
            throw new Error(`Tutor not found: ${item.tutorId}`)
          }

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
              tutorEarningsCad: item.tutorEarningsCad,
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
            tutorId: { in: cartItems.map(item => item.tutorId) },
            startDatetime: { in: cartItems.map(item => new Date(item.startDatetime)) }
          }
        })

        // Clear the cart
        await tx.cartItem.deleteMany({
          where: { cartId: cartId }
        })

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

        return { order, orderItems, appointments }
      })

      // Handle user creation/update
      let actualUserId = userId
      
      // Check if this is a guest user (userId starts with 'guest_')
      if (userId.startsWith('guest_')) {
        console.log('Guest user payment detected - account creation will be handled by confirm-payment-with-password API')
        
        // For guest users, we don't create accounts here anymore
        // The confirm-payment-with-password API will handle account creation and order/appointment creation
        // We keep the payment intent data so the API can access it
        console.log('Guest payment processed - waiting for account creation via API')
        return NextResponse.json({ received: true })
      } else {
        // Existing authenticated user - update Stripe customer ID if not already set
        if (paymentIntent.customer) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: paymentIntent.customer as string }
          })
        }

        // Save payment method if it's a new one
        if (paymentIntent.payment_method) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: userId }
            })

            if (user && !user.defaultPaymentMethodId) {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  defaultPaymentMethodId: paymentIntent.payment_method as string
                }
              })
              console.log('Saved new payment method for user:', userId)
            }
          } catch (error) {
            console.error('Error saving payment method:', error)
            // Don't fail the webhook for this
          }
        }
      }

      // Clean up payment intent data after successful processing
      await prisma.paymentIntentData.delete({
        where: { paymentIntentId: paymentIntent.id }
      })

      // Send Make.com webhook for booking confirmation
      try {
        // Fetch full order details with relationships
        const orderWithDetails = await prisma.order.findUnique({
          where: { id: result.order.id },
          include: {
            items: {
              include: {
                course: true,
                tutor: {
                  include: {
                    user: true
                  }
                },
                appointment: true
              }
            }
          }
        })

        if (orderWithDetails) {
          const { sendBookingCreatedWebhook } = await import('@/lib/webhooks/make')
          
          await sendBookingCreatedWebhook({
            orderId: orderWithDetails.id,
            userId: orderWithDetails.userId,
            currency: orderWithDetails.currency || 'CAD',
            subtotalCad: Number(orderWithDetails.subtotalCad),
            discountCad: Number(orderWithDetails.discountCad),
            totalCad: Number(orderWithDetails.totalCad),
            couponCode: finalCouponCode || undefined,
            items: orderWithDetails.items.map(item => ({
              appointmentId: item.appointment?.id || '',
              courseId: item.courseId,
              courseTitleFr: item.course.titleFr,
              tutorId: item.tutorId,
              tutorName: item.tutor.displayName,
              startDatetime: item.startDatetime.toISOString(),
              durationMin: item.durationMin,
              priceCad: Number(item.lineTotalCad),
              tutorEarningsCad: Number(item.tutorEarningsCad)
            })),
            createdAt: orderWithDetails.createdAt.toISOString()
          })
        }
      } catch (webhookError) {
        // Don't fail the webhook processing if Make.com webhook fails
        console.error('Error sending booking.created webhook:', webhookError)
      }

      console.log('Payment intent processed successfully:', {
        orderId: result.order.id,
        appointmentsCreated: result.appointments.length,
        totalAmount: paymentIntent.amount / 100
      })
    }

    // Mark webhook as processed
    await prisma.webhookEvent.updateMany({
      where: { 
        source: 'stripe',
        type: event.type,
        payloadJson: { contains: event.id }
      },
      data: { processedAt: new Date() }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    
    // Mark webhook as processed even if it failed (to avoid retries)
    await prisma.webhookEvent.updateMany({
      where: { 
        source: 'stripe',
        type: event.type,
        payloadJson: { contains: event.id }
      },
      data: { processedAt: new Date() }
    })
    
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}