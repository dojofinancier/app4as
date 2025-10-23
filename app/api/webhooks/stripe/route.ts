import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { calculateTutorEarnings } from '@/lib/pricing'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log the webhook event
  console.log('=== STRIPE WEBHOOK RECEIVED ===')
  console.log('Event type:', event.type)
  console.log('Event ID:', event.id)
  console.log('Event data:', JSON.stringify(event.data, null, 2))

  await prisma.webhookEvent.create({
    data: {
      source: 'stripe',
      type: event.type,
      payloadJson: JSON.stringify(event.data)
    }
  })

  try {
    if (event.type === 'payment_intent.succeeded') {
      console.log('=== PROCESSING PAYMENT_INTENT.SUCCEEDED ===')
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      console.log('Payment Intent ID:', paymentIntent.id)
      console.log('Payment Intent metadata:', paymentIntent.metadata)
      
      // Get metadata from the payment intent
      const {
        userId,
        cartId,
        itemCount,
        couponCode,
        discountAmount
      } = paymentIntent.metadata || {}

      if (!userId || !cartId) {
        console.error('Missing required metadata in payment intent:', paymentIntent.metadata)
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      // Get cart data from database
      const paymentIntentData = await prisma.paymentIntentData.findUnique({
        where: { paymentIntentId: paymentIntent.id }
      })

      if (!paymentIntentData) {
        console.error('No payment intent data found for:', paymentIntent.id)
        return NextResponse.json({ error: 'Payment intent data not found' }, { status: 400 })
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
        // We just need to clean up the payment intent data
        await prisma.paymentIntentData.delete({
          where: { paymentIntentId: paymentIntent.id }
        })
        
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

      // TODO: Send Make.com webhook for booking confirmation
      // This will handle email notifications and calendar invites

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