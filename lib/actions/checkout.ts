'use server'

import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateCartByIdentity } from './cart'
import { calculateOrderPricing, calculateTutorEarnings } from '@/lib/pricing'
import { formatDateTime } from '@/lib/utils'

/**
 * Create Stripe Payment Intent from cart
 */
export async function createPaymentIntent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('createPaymentIntent: Starting, user:', user ? 'authenticated' : 'guest')

  try {
    let cart
    let dbUser = null
    let userId = null

    if (user) {
      // Authenticated user
      cart = await getOrCreateCartByIdentity({ userId: user.id })
      dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      })
      userId = user.id
    } else {
      // Guest user - get cart by session
      console.log('createPaymentIntent: Guest user flow - importing session utils')
      const { getCartSessionId } = await import('@/lib/utils/session')
      console.log('createPaymentIntent: Session utils imported, calling getCartSessionId')
      const sessionId = await getCartSessionId()
      
      console.log('createPaymentIntent: Guest user, sessionId:', sessionId)
      console.log('createPaymentIntent: Session ID type:', typeof sessionId)
      console.log('createPaymentIntent: Session ID length:', sessionId?.length)
      
      if (!sessionId) {
        console.log('createPaymentIntent: No session ID found - returning error')
        return { success: false, error: 'Session de panier introuvable' }
      }
      
      // Set session id for RLS policies
      try {
        await prisma.$executeRaw`select set_config('app.cart_session_id', ${sessionId}, true)`
      } catch (e) {
        // ignore if not configured
      }
      
      cart = await getOrCreateCartByIdentity({ sessionId })
      console.log('createPaymentIntent: Cart found, items count:', cart.items.length)
      userId = `guest_${sessionId}` // Use session ID as guest user ID
    }

    if (cart.items.length === 0) {
      return { success: false, error: 'Votre panier est vide' }
    }

    // Calculate totals using dual rate system
    const orderPricing = calculateOrderPricing(
      cart.items.map((item) => ({
        courseId: item.courseId,
        tutorId: item.tutorId,
        durationMin: item.durationMin as 60 | 90 | 120,
        courseRate: Number(item.course.studentRateCad),
        tutorRate: Number(item.tutor.hourlyBaseRateCad),
      })),
      cart.coupon?.type,
      cart.coupon?.value ? Number(cart.coupon.value) : undefined
    )

    // Create or get Stripe customer
    const stripe = getStripe()
    console.log('createPaymentIntent: Stripe client created')
    let customerId: string

    if (user && dbUser?.stripeCustomerId) {
      // Authenticated user with existing Stripe customer
      customerId = dbUser.stripeCustomerId
    } else if (user && dbUser) {
      // Authenticated user without Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId: customerId },
      })
    } else {
      // Guest user - create temporary customer
      console.log('createPaymentIntent: Creating guest customer for userId:', userId)
      const customer = await stripe.customers.create({
        metadata: {
          userId: userId, // guest_sessionId
          isGuest: 'true',
        },
      })
      console.log('createPaymentIntent: Guest customer created:', customer.id)
      customerId = customer.id
    }

    // Store cart data in database for webhook processing
    const cartData = {
      items: cart.items.map((item) => ({
        courseId: item.courseId,
        tutorId: item.tutorId,
        startDatetime: item.startDatetime.toISOString(),
        durationMin: item.durationMin,
        unitPriceCad: Number(item.unitPriceCad),
        lineTotalCad: Number(item.lineTotalCad),
        // Calculate tutor earnings for each item
        tutorEarningsCad: calculateTutorEarnings(Number(item.tutor.hourlyBaseRateCad), item.durationMin as 60 | 90 | 120),
      })),
      couponCode: cart.coupon?.code || '',
      discountAmount: orderPricing.discount,
    }

    // Create Payment Intent with minimal metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(orderPricing.total * 100), // Convert to cents
      currency: 'cad',
      customer: customerId,
      metadata: {
        userId: userId, // Can be real user ID or guest_sessionId
        cartId: cart.id,
        // Store only essential info in metadata (under 500 chars)
        itemCount: cart.items.length.toString(),
        couponCode: cart.coupon?.code || '',
        discountAmount: orderPricing.discount.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store the full cart data in the database for webhook processing
    await prisma.paymentIntentData.create({
      data: {
        paymentIntentId: paymentIntent.id,
        cartData: JSON.stringify(cartData),
        userId: userId, // Store the userId for webhook processing
      }
    })

    return { 
      success: true, 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return { success: false, error: error instanceof Error ? error.message : 'Une erreur est survenue' }
  }
}

/**
 * Create Setup Intent for saving payment methods
 */
export async function createSetupIntent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Get user from database to access Stripe customer ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    const stripe = getStripe()
    let customerId: string

    if (dbUser.stripeCustomerId) {
      customerId = dbUser.stripeCustomerId
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })

    return { 
      success: true, 
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    }
  } catch (error) {
    console.error('Error creating setup intent:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get payment intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return { success: true, paymentIntent }
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    return { success: false, error: 'Payment intent introuvable' }
  }
}