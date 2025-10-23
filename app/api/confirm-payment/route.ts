import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  let paymentIntentId: string | undefined
  
  try {
    console.log('=== CONFIRM PAYMENT START ===')
    console.log('Request received at:', new Date().toISOString())
    
    const stripe = getStripe()
    console.log('Stripe client initialized successfully')
    
    // Parse request body
    const body = await request.json()
    console.log('Request body parsed:', { 
      paymentIntentId: body.paymentIntentId, 
      hasUserInfo: !!body.userInfo, 
      hasBillingAddress: !!body.billingAddress 
    })
    
    const { paymentIntentId: piId, userInfo, billingAddress } = body
    paymentIntentId = piId

    if (!paymentIntentId) {
      throw new Error('Payment Intent ID is required')
    }

    // Retrieve payment intent from Stripe
    console.log('Retrieving payment intent from Stripe:', paymentIntentId)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    console.log('Payment intent retrieved:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata
    })
    
    if (paymentIntent.status !== 'succeeded') {
      console.log('Payment not succeeded, status:', paymentIntent.status)
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const metadata = paymentIntent.metadata
    console.log('Extracting metadata:', metadata)
    
    const holdId = metadata.holdId
    const tutorId = metadata.tutorId
    const courseId = metadata.courseId
    const startDatetime = new Date(metadata.startDatetime)
    const duration = parseInt(metadata.duration)

    console.log('Extracted data:', {
      holdId,
      tutorId,
      courseId,
      startDatetime: startDatetime.toISOString(),
      duration
    })

    // Create or get user from the hold
    const hold = await prisma.slotHold.findUnique({ where: { id: holdId } })
    let userId = hold?.userId
    
    // If userInfo is provided, this is a guest checkout - create the user
    if (userInfo) {
      console.log('Creating new user from guest checkout')
      try {
        const supabase = await createClient()
        
        // Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userInfo.email,
          password: userInfo.password,
          options: {
            data: {
              first_name: userInfo.firstName,
              last_name: userInfo.lastName,
              phone: userInfo.phone || null
            }
          }
        })
        
        if (authError || !authData.user) {
          console.error('Error creating Supabase Auth user:', authError)
          throw new Error('Impossible de créer le compte utilisateur')
        }
        
        console.log('Supabase Auth user created:', authData.user.id)
        
        // Create or update database user with the Auth user ID
        const newUser = await prisma.user.upsert({
          where: { id: authData.user.id },
          create: {
            id: authData.user.id,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            email: userInfo.email,
            phone: userInfo.phone || null,
            role: 'student'
          },
          update: {
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            email: userInfo.email,
            phone: userInfo.phone || null
          }
        })
        
        userId = newUser.id
        console.log('Database user created with ID:', userId)
        
        // Auto sign-in the new user
        await supabase.auth.signInWithPassword({
          email: userInfo.email,
          password: userInfo.password
        })
        console.log('User automatically signed in')
      } catch (error) {
        console.error('Error creating new user:', error)
        throw error
      }
    }
    
    if (!userId) {
      throw new Error('Impossible de déterminer l\'utilisateur pour cette réservation')
    }

    // Idempotency: if order already exists for this payment intent, return success
    const existingOrder = await prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId } })
    if (existingOrder) {
      console.log('Order already exists for this payment intent, returning success')
      return NextResponse.json({ success: true, orderId: existingOrder.id })
    }

    // Transaction: create order, order item, appointment, delete hold
    let order
    let orderItem
    await prisma.$transaction(async (tx) => {
      // Ensure hold exists and is not expired
      const hold = await tx.slotHold.findUnique({ where: { id: holdId } })
      if (!hold || hold.expiresAt < new Date()) {
        throw new Error('La réservation a expiré. Veuillez choisir un autre créneau.')
      }

      console.log('Creating order with data:', {
        userId,
        status: 'paid',
        subtotalCad: paymentIntent.amount / 100,
        totalCad: paymentIntent.amount / 100,
        stripePaymentIntentId: paymentIntentId
      })
      order = await tx.order.create({
        data: {
          userId: userId,
          status: 'paid',
          subtotalCad: paymentIntent.amount / 100,
          totalCad: paymentIntent.amount / 100,
          stripePaymentIntentId: paymentIntentId
        }
      })

      orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          courseId: courseId,
          tutorId: tutorId,
          startDatetime: startDatetime,
          durationMin: duration,
          unitPriceCad: paymentIntent.amount / 100,
          lineTotalCad: paymentIntent.amount / 100
        }
      })

      await tx.appointment.create({
        data: {
          userId: userId,
          tutorId: tutorId,
          courseId: courseId,
          startDatetime: startDatetime,
          endDatetime: new Date(startDatetime.getTime() + duration * 60000),
          status: 'scheduled',
          orderItemId: orderItem.id
        }
      })

      await tx.slotHold.delete({ where: { id: holdId } })
    })

    console.log('=== CONFIRM PAYMENT SUCCESS ===')
    return NextResponse.json({ success: true, orderId: order!.id })

    } catch (error) {
      console.error('=== CONFIRM PAYMENT ERROR ===')
      console.error('Error type:', typeof error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('Full error object:', error)
      console.error('=== END ERROR LOG ===')
      
      // CRITICAL: Payment has already succeeded, so we need to handle this gracefully
      // Log the error for manual resolution, but don't fail the user experience
      console.error('PAYMENT SUCCEEDED BUT BOOKING FAILED - MANUAL RESOLUTION REQUIRED')
      console.error('Payment Intent ID:', paymentIntentId)
      console.error('User should be contacted and booking manually completed')
      
      return NextResponse.json(
        { 
          error: 'Votre paiement a été traité avec succès, mais il y a eu un problème technique. Notre équipe va résoudre cela rapidement et vous contacter sous peu.',
          paymentIntentId: paymentIntentId,
          requiresManualResolution: true
        },
        { status: 200 } // Return 200 so user doesn't think payment failed
      )
    }
}
