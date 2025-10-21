'use server'

import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateCart } from './cart'
import { calculateOrderTotals } from '@/lib/pricing'
import { formatDateTime } from '@/lib/utils'

/**
 * Create Stripe Checkout session from cart
 */
export async function createCheckoutSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const cart = await getOrCreateCart(user.id)

    if (cart.items.length === 0) {
      return { success: false, error: 'Votre panier est vide' }
    }

    // Calculate totals
    const totals = calculateOrderTotals(
      cart.items.map((item) => ({ price: item.unitPriceCad.toNumber() })),
      cart.coupon
        ? {
            type: cart.coupon.type,
            value: cart.coupon.value,
          }
        : undefined
    )

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.items.map((item) => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: `${item.course.titleFr} - ${item.tutor.displayName}`,
            description: `${formatDateTime(item.startDatetime)} (${item.durationMin} min)`,
          },
          unit_amount: Math.round(item.unitPriceCad.toNumber() * 100),
        },
        quantity: 1,
      }))

    // If there's a discount, add it as a negative line item
    if (totals.discount > 0) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Rabais - ${cart.coupon?.code}`,
          },
          unit_amount: -Math.round(totals.discount * 100),
        },
        quantity: 1,
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Checkout session
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: user.email,
      billing_address_collection: 'required',
      metadata: {
        userId: user.id,
        cartId: cart.id,
      },
      success_url: `${appUrl}/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/paiement/annule`,
    })

    return { success: true, sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return { success: true, session }
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    return { success: false, error: 'Session introuvable' }
  }
}

