import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateEnvForRoute } from '@/lib/utils/env-validation'
import { rateLimit } from '@/lib/utils/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests per minute per IP (guest checkout)
  const rateLimitResponse = rateLimit(request, 'PAYMENT')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Validate critical environment variables for payment confirmation
  try {
    validateEnvForRoute(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL'])
  } catch (error) {
    console.error('Environment validation failed:', error)
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { paymentIntentId, password, billingInfo } = body

    if (!paymentIntentId || !password || !billingInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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

    // Parse cart data
    const cartData = JSON.parse(paymentIntentData.cartData)
    
    // Check if user already exists
    const supabase = await createClient()
    
    // First, try to sign in to see if user exists
    const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
      email: billingInfo.email,
      password: password
    })

    let authData: any = existingUser
    let authError = signInError

    // If sign in failed, try to create new account
    if (signInError) {
      const { data: newUserData, error: signUpError } = await supabase.auth.signUp({
        email: billingInfo.email,
        password: password,
        options: {
          data: {
            first_name: billingInfo.firstName,
            last_name: billingInfo.lastName,
            phone: billingInfo.phone || undefined,
          }
        }
      })

      authData = newUserData
      authError = signUpError

      // If sign up failed because user already exists, return specific error
      if (signUpError && signUpError.code === 'user_already_exists') {
        return NextResponse.json(
          { 
            error: 'Un compte existe déjà avec cette adresse email',
            code: 'USER_ALREADY_EXISTS',
            message: 'Veuillez vous connecter avec votre compte existant'
          },
          { status: 409 }
        )
      }

    }

    if (authError) {
      console.error('Error with user authentication:', authError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'authentification' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Impossible de créer le compte utilisateur' },
        { status: 400 }
      )
    }

    // Create the user record in our database (only if it doesn't exist)
    let isNewUser = false
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email: billingInfo.email,
          firstName: billingInfo.firstName,
          lastName: billingInfo.lastName,
          phone: billingInfo.phone || undefined,
          role: 'student'
        }
      })
      isNewUser = true // User was created (new signup)
    } catch (error: any) {
      // If user already exists in database, that's fine - continue with the order
      if (error.code !== 'P2002') { // P2002 is unique constraint violation
        throw error
      }
    }

    // Create orders and appointments for the new user
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId: authData.user.id,
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

        // Create the appointment
        const appointment = await tx.appointment.create({
          data: {
            userId: authData.user.id,
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

      // Clean up payment intent data
      await tx.paymentIntentData.delete({
        where: { paymentIntentId }
      })

      return { order, orderItems, appointments }
    })

    // Send Make.com webhook for booking confirmation
    try {
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
        const { sendBookingCreatedWebhook, sendSignupWebhook } = await import('@/lib/webhooks/make')
        
        // Send signup webhook if this is a new user (guest checkout account creation)
        if (isNewUser) {
          try {
            const newUser = await prisma.user.findUnique({
              where: { id: orderWithDetails.userId },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                createdAt: true
              }
            })
            
            if (newUser) {
              await sendSignupWebhook({
                userId: newUser.id,
                role: newUser.role,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                phone: newUser.phone,
                createdAt: newUser.createdAt.toISOString()
              })
            }
          } catch (signupWebhookError) {
            // Don't fail if signup webhook fails
            console.error('Error sending signup webhook:', signupWebhookError)
          }
        }
        
        // Fetch user phone for booking webhook
        const userForBooking = await prisma.user.findUnique({
          where: { id: orderWithDetails.userId },
          select: { phone: true }
        })

        // Send booking created webhook
        await sendBookingCreatedWebhook({
          orderId: orderWithDetails.id,
          userId: orderWithDetails.userId,
          currency: orderWithDetails.currency || 'CAD',
          subtotalCad: Number(orderWithDetails.subtotalCad),
          discountCad: Number(orderWithDetails.discountCad),
          totalCad: Number(orderWithDetails.totalCad),
          couponCode: cartData.couponCode || undefined,
          phone: userForBooking?.phone || null,
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
      // Don't fail the request if webhook fails
      console.error('Error sending booking.created webhook:', webhookError)
    }

    // User is already signed in from the authentication step above

    return NextResponse.json({ 
      success: true, 
      userId: authData.user.id,
      appointmentsCreated: result.appointments.length
    })

  } catch (error) {
    console.error('Error confirming payment with password:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
