import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating payment intent...')
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY)
    console.log('STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 7))
    
    const stripe = getStripe()
    const body = await request.json()
    console.log('Request body:', body)
    
    const { sessionId, billingAddress, useSavedPaymentMethod, paymentMethodId, savePaymentMethod, userInfo } = body
    if (!sessionId) {
      return NextResponse.json({ error: 'Session manquante' }, { status: 400 })
    }

    // Validate sessionId is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'ID de session invalide' }, { status: 400 })
    }

    // Load from DB: treat sessionId as holdId
    const hold = await prisma.slotHold.findUnique({ 
      where: { id: sessionId },
      include: { user: true }
    })
    
    if (!hold) {
      return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
    }

    if (hold.expiresAt < new Date()) {
      return NextResponse.json({ 
        error: 'Session expirée. Veuillez sélectionner un nouveau créneau.' 
      }, { status: 410 })
    }

    // Fetch course and tutor data
    const course = await prisma.course.findUnique({ where: { id: hold.courseId } })
    if (!course) {
      console.log('Course not found:', hold.courseId)
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 })
    }
    console.log('Course found:', course.titleFr)

    const tutorId = hold.tutorId
    console.log('Fetching tutor:', tutorId)
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: { user: true }
    })

    if (!tutor) {
      console.log('Tutor not found:', tutorId)
      return NextResponse.json({ error: 'Tuteur non trouvé' }, { status: 404 })
    }
    console.log('Tutor found:', tutor.displayName)

    const courseSlug = course.slug
    const slot = {
      start: hold.startDatetime.toISOString(),
      end: new Date(hold.startDatetime.getTime() + hold.durationMin * 60000).toISOString()
    }
    const duration = hold.durationMin
    const holdId = hold.id

    // Calculate price
    const multiplier = duration === 60 ? 1 : duration === 90 ? 1.5 : 2
    const totalPrice = Number(tutor.hourlyBaseRateCad) * multiplier

    // No DB writes here; hold was created during session creation

    // Get or create Stripe customer for logged-in users only
    let customerId: string | null = null
    if (hold.user && hold.userId) {
      // Only create Stripe customer for actual logged-in users
      customerId = hold.user.stripeCustomerId
      if (!customerId) {
        // Create Stripe customer if it doesn't exist
        const customer = await stripe.customers.create({
          email: hold.user.email,
          name: `${hold.user.firstName} ${hold.user.lastName}`,
          metadata: {
            userId: hold.user.id
          }
        })
        customerId = customer.id
        
        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: hold.user.id },
          data: { stripeCustomerId: customerId }
        })
      }
    }

    // Create payment intent only after validation passes
    console.log('Creating Stripe payment intent with amount:', Math.round(totalPrice * 100))
    
    const paymentIntentData: any = {
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'cad',
      metadata: {
        holdId: holdId,
        tutorId: tutorId,
        courseId: course.id,
        startDatetime: new Date(slot.start).toISOString(),
        duration: duration.toString(),
        courseSlug: courseSlug,
        userId: hold.userId,
        ...(billingAddress && { 
          billingAddress: JSON.stringify(billingAddress)
        }),
        ...(userInfo && { 
          userInfo: JSON.stringify(userInfo)
        })
      },
    }

    // Add customer and setup_future_usage for logged-in users only
    if (customerId) {
      paymentIntentData.customer = customerId
      // Only set setup_future_usage if user consents to save payment method
      if (savePaymentMethod) {
        paymentIntentData.setup_future_usage = 'off_session'
      }
    }

    // If using saved payment method, set it as the payment method
    if (useSavedPaymentMethod && paymentMethodId) {
      paymentIntentData.payment_method = paymentMethodId
      paymentIntentData.confirmation_method = 'automatic'
    } else {
      paymentIntentData.automatic_payment_methods = {
        enabled: true,
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)
    console.log('Payment intent created:', paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      holdId: holdId
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du paiement' },
      { status: 500 }
    )
  }
}
