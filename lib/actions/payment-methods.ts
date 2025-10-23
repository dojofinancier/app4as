'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'

export async function createPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string; customerId?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    if (!stripe) {
      return { success: false, error: 'Stripe non initialisé' }
    }

    // Get or create Stripe customer
    let customerId = currentUser.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: currentUser.email,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        metadata: {
          userId: currentUser.id
        }
      })
      customerId = customer.id
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    // Update user in database
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        stripeCustomerId: customerId,
        defaultPaymentMethodId: paymentMethodId
      }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, customerId }
  } catch (error) {
    console.error('Error creating payment method:', error)
    return { success: false, error: 'Erreur lors de l\'ajout de la méthode de paiement' }
  }
}

export async function getPaymentMethod(): Promise<{ 
  success: boolean; 
  error?: string; 
  paymentMethod?: any 
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    if (!stripe) {
      return { success: false, error: 'Stripe non initialisé' }
    }

    if (!currentUser.stripeCustomerId || !currentUser.defaultPaymentMethodId) {
      return { success: true, paymentMethod: null }
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(
      currentUser.defaultPaymentMethodId
    )

    return { success: true, paymentMethod }
  } catch (error) {
    console.error('Error getting payment method:', error)
    return { success: false, error: 'Erreur lors de la récupération de la méthode de paiement' }
  }
}

export async function updatePaymentMethod(
  newPaymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    if (!stripe) {
      return { success: false, error: 'Stripe non initialisé' }
    }

    if (!currentUser.stripeCustomerId) {
      return { success: false, error: 'Aucun client Stripe trouvé' }
    }

    // Attach new payment method
    await stripe.paymentMethods.attach(newPaymentMethodId, {
      customer: currentUser.stripeCustomerId
    })

    // Set as default
    await stripe.customers.update(currentUser.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: newPaymentMethodId
      }
    })

    // Detach old payment method if it exists
    if (currentUser.defaultPaymentMethodId) {
      try {
        await stripe.paymentMethods.detach(currentUser.defaultPaymentMethodId)
      } catch (error) {
        console.warn('Could not detach old payment method:', error)
      }
    }

    // Update user in database
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        defaultPaymentMethodId: newPaymentMethodId
      }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error updating payment method:', error)
    return { success: false, error: 'Erreur lors de la mise à jour de la méthode de paiement' }
  }
}

export async function deletePaymentMethod(): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    if (!stripe) {
      return { success: false, error: 'Stripe non initialisé' }
    }

    if (!currentUser.defaultPaymentMethodId) {
      return { success: false, error: 'Aucune méthode de paiement à supprimer' }
    }

    // Detach payment method from Stripe
    await stripe.paymentMethods.detach(currentUser.defaultPaymentMethodId)

    // Update user in database
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        defaultPaymentMethodId: null
      }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return { success: false, error: 'Erreur lors de la suppression de la méthode de paiement' }
  }
}

// Admin function to get user's payment method
export async function getAdminUserPaymentMethod(
  userId: string
): Promise<{ 
  success: boolean; 
  error?: string; 
  paymentMethod?: any;
  user?: any;
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Non autorisé' }
    }

    if (!stripe) {
      return { success: false, error: 'Stripe non initialisé' }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        stripeCustomerId: true,
        defaultPaymentMethodId: true
      }
    })

    if (!user) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    if (!user.stripeCustomerId || !user.defaultPaymentMethodId) {
      return { success: true, user, paymentMethod: null }
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(
      user.defaultPaymentMethodId
    )

    return { success: true, user, paymentMethod }
  } catch (error) {
    console.error('Error getting admin user payment method:', error)
    return { success: false, error: 'Erreur lors de la récupération de la méthode de paiement' }
  }
}
