import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, password, billingAddress } = body

    if (!paymentIntentId || !password || !billingAddress) {
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
    
    // Create user account with Supabase Auth
    const supabase = await createClient()
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: billingAddress.email,
      password: password,
      options: {
        data: {
          first_name: billingAddress.firstName,
          last_name: billingAddress.lastName,
          phone: billingAddress.phone,
        }
      }
    })

    if (authError) {
      console.error('Error creating user account:', authError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Impossible de créer le compte utilisateur' },
        { status: 400 }
      )
    }

    // Create the user record in our database
    await prisma.user.create({
      data: {
        id: authData.user.id,
        email: billingAddress.email,
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        phone: billingAddress.phone,
        role: 'student'
      }
    })

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

    // Sign in the user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: billingAddress.email,
      password: password
    })

    if (signInError) {
      console.error('Error signing in user:', signInError)
      // Don't fail the request, user account was created successfully
    }

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
