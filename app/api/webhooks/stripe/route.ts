import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

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
    if (event.type === 'checkout.session.completed') {
      console.log('=== PROCESSING CHECKOUT.SESSION.COMPLETED ===')
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log('Session ID:', session.id)
      console.log('Session metadata:', session.metadata)
      
      // Get metadata from the session
      const {
        holdId,
        tutorId,
        startDatetime,
        endDatetime,
        duration,
        courseSlug,
        firstName,
        lastName,
        phone,
        password,
        isNewUser,
        userInfo: userInfoJson
      } = session.metadata || {}

      // Parse user info if provided (for guest users)
      let userInfo = null
      if (userInfoJson) {
        try {
          userInfo = JSON.parse(userInfoJson)
        } catch (error) {
          console.error('Error parsing userInfo:', error)
        }
      }

      console.log('Extracted metadata:', {
        holdId,
        tutorId,
        startDatetime,
        endDatetime,
        duration,
        courseSlug,
        isNewUser
      })


      if (!holdId || !tutorId) {
        console.error('Missing required metadata in checkout session')
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      // Find the course
      const course = await prisma.course.findUnique({
        where: { slug: courseSlug }
      })

      if (!course) {
        console.error('Course not found:', courseSlug)
        return NextResponse.json({ error: 'Course not found' }, { status: 400 })
      }


      let userId: string

      if (isNewUser === 'true') {
        // Create new user account
        const supabase = await createClient()
        
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: session.customer_email!,
          password: password || 'temp_password_' + Date.now(), // Generate temp password if not provided
          email_confirm: true,
          user_metadata: {
            first_name: userInfo?.firstName || firstName,
            last_name: userInfo?.lastName || lastName,
            phone: userInfo?.phone || phone
          }
        })

        if (authError) {
          console.error('Error creating user in Supabase:', authError)
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        // Create user in our database
        const user = await prisma.user.create({
          data: {
            id: authData.user.id,
            email: session.customer_email!,
            firstName: userInfo?.firstName || firstName,
            lastName: userInfo?.lastName || lastName,
            phone: userInfo?.phone || phone,
            role: 'student'
          }
        })

        userId = user.id
      } else {
        // User already exists, get their ID from the hold
        const hold = await prisma.slotHold.findUnique({
          where: { id: holdId },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true }
            }
          }
        })
        
        if (!hold?.userId) {
          console.error('Hold not found or no user ID')
          return NextResponse.json({ error: 'Invalid hold' }, { status: 400 })
        }
        
        userId = hold.userId
        
        // If this is a temporary user (guest), update it with real data
        if (hold.userId.startsWith('guest_')) {
          console.log('Updating temporary user with real data:', hold.userId)
          
          // Create user in Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: session.customer_email!,
            password: password || 'temp_password_' + Date.now(), // Generate temp password if not provided
            email_confirm: true,
            user_metadata: {
              first_name: userInfo?.firstName || firstName,
              last_name: userInfo?.lastName || lastName,
              phone: userInfo?.phone || phone
            }
          })

          if (authError) {
            console.error('Error creating user in Supabase:', authError)
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
          }

          // Update the temporary user with real data
          await prisma.user.update({
            where: { id: hold.userId },
            data: {
              id: authData.user.id, // Update to real Supabase user ID
              email: session.customer_email!,
              firstName: userInfo?.firstName || firstName,
              lastName: userInfo?.lastName || lastName,
              phone: userInfo?.phone || phone,
              role: 'student'
            }
          })
          
          // Update the slot hold to use the new user ID
          await prisma.slotHold.update({
            where: { id: holdId },
            data: { userId: authData.user.id }
          })
          
          userId = authData.user.id
        }
      }

      console.log('Creating order and appointment for user:', userId)

      // Create everything in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the order
        const order = await tx.order.create({
          data: {
            userId: userId,
            totalCad: session.amount_total! / 100, // Convert from cents
            status: 'completed',
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string
          }
        })

        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            courseId: course.id,
            tutorId: tutorId,
            startDatetime: new Date(startDatetime),
            endDatetime: new Date(endDatetime),
            priceCad: session.amount_total! / 100
          }
        })

        // Check if appointment already exists for this order item
        const existingAppointment = await tx.appointment.findUnique({
          where: { orderItemId: orderItem.id }
        })

        if (existingAppointment) {
          return { order, orderItem, appointment: existingAppointment }
        }

        // Create the appointment

        const appointment = await tx.appointment.create({
          data: {
            userId: userId,
            tutorId: tutorId,
            courseId: course.id,
            startDatetime: new Date(startDatetime),
            endDatetime: new Date(endDatetime),
            status: 'scheduled',
            orderItemId: orderItem.id
          }
        })

        // Delete the hold
        await tx.slotHold.delete({
          where: { id: holdId }
        })

        return { order, orderItem, appointment }
      })

      // TODO: Send Make.com webhook for booking confirmation
      // This will handle email notifications and calendar invites

      console.log('Booking completed successfully')
    }

    if (event.type === 'payment_intent.succeeded') {
      console.log('=== PROCESSING PAYMENT_INTENT.SUCCEEDED ===')
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      console.log('Payment Intent ID:', paymentIntent.id)
      console.log('Payment Intent metadata:', paymentIntent.metadata)
      
      // Get metadata from the payment intent
      const {
        holdId,
        tutorId,
        courseId,
        startDatetime,
        duration,
        courseSlug,
        recurringSessionId
      } = paymentIntent.metadata || {}

      if (!holdId || !tutorId) {
        console.error('Missing required metadata in payment intent')
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      // Get the user from the hold
      const hold = await prisma.slotHold.findUnique({
        where: { id: holdId },
        include: { user: true }
      })

      if (!hold) {
        console.error('Hold not found:', holdId)
        return NextResponse.json({ error: 'Hold not found' }, { status: 400 })
      }

      const userId = hold.userId

      // Save payment method if it's a new one and user is logged in
      if (paymentIntent.payment_method && userId) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId }
          })

          if (user && !user.defaultPaymentMethodId) {
            // This is a new payment method for a logged-in user
            // Save it as their default payment method
            await prisma.user.update({
              where: { id: userId },
              data: {
                stripeCustomerId: paymentIntent.customer as string,
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

      // Create order, order item, and appointment
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      })

      if (!course) {
        console.error('Course not found:', courseId)
        return NextResponse.json({ error: 'Course not found' }, { status: 400 })
      }

      const { order, orderItem, appointment } = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            userId: userId,
            status: 'paid',
            subtotalCad: paymentIntent.amount / 100,
            totalCad: paymentIntent.amount / 100,
            stripePaymentIntentId: paymentIntent.id
          }
        })

        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            courseId: courseId,
            tutorId: tutorId,
            startDatetime: new Date(startDatetime),
            durationMin: parseInt(duration),
            unitPriceCad: paymentIntent.amount / 100,
            lineTotalCad: paymentIntent.amount / 100
          }
        })

        // Create appointment(s)
        let appointment
        if (recurringSessionId) {
          // For recurring sessions, generate all appointments
          const recurringSession = await tx.recurringSession.findUnique({
            where: { id: recurringSessionId }
          })
          
          if (!recurringSession) {
            throw new Error('Recurring session not found')
          }

          const appointments = []
          let currentDate = new Date(recurringSession.startDate)
          const endDate = new Date(recurringSession.endDate || new Date())
          
          // Generate all appointment dates
          while (currentDate <= endDate && appointments.length < recurringSession.totalSessions) {
            // Check if this time slot is available
            const existingAppointment = await tx.appointment.findFirst({
              where: {
                tutorId: recurringSession.tutorId,
                startDatetime: currentDate,
                status: { in: ['scheduled', 'completed'] }
              }
            })

            if (!existingAppointment) {
              const endDateTime = new Date(currentDate.getTime() + recurringSession.durationMin * 60000)
              
              const newAppointment = await tx.appointment.create({
                data: {
                  userId: userId,
                  tutorId: recurringSession.tutorId,
                  courseId: recurringSession.courseId,
                  orderItemId: orderItem.id,
                  startDatetime: currentDate,
                  endDatetime: endDateTime,
                  durationMin: recurringSession.durationMin,
                  status: 'scheduled',
                  recurringSessionId: recurringSessionId
                }
              })
              
              appointments.push(newAppointment)
            }

            // Move to next appointment date
            const daysToAdd = recurringSession.frequency === 'weekly' ? 7 : 14
            currentDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
          }

          // Update recurring session with sessions created count
          await tx.recurringSession.update({
            where: { id: recurringSessionId },
            data: {
              sessionsCreated: appointments.length
            }
          })

          appointment = appointments[0] // Return first appointment for compatibility
        } else {
          // Regular single appointment
          appointment = await tx.appointment.create({
            data: {
              userId: userId,
              tutorId: tutorId,
              courseId: courseId,
              orderItemId: orderItem.id,
              startDatetime: new Date(startDatetime),
              endDatetime: new Date(new Date(startDatetime).getTime() + parseInt(duration) * 60000),
              durationMin: parseInt(duration),
              status: 'scheduled'
            }
          })
        }

        // Delete the hold
        await tx.slotHold.delete({
          where: { id: holdId }
        })

        return { order, orderItem, appointment }
      })

      console.log('Payment intent processed successfully')
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