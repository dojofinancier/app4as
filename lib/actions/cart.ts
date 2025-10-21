'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { addMinutes } from 'date-fns'
import { calculateStudentPrice, validateCoupon } from '@/lib/pricing'
import type { Duration } from '@/lib/slots/types'

const HOLD_TTL_MINUTES = 15

/**
 * Get or create cart for current user
 */
export async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
        include: {
          course: true,
          tutor: true,
        },
      },
      coupon: true,
    },
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            course: true,
            tutor: true,
          },
        },
        coupon: true,
      },
    })
  }

  return cart
}

/**
 * Add item to cart and create slot hold
 */
export async function addToCart(data: {
  courseId: string
  tutorId: string
  startDatetime: Date
  durationMin: Duration
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Get course and tutor to calculate price
    const [course, tutor] = await Promise.all([
      prisma.course.findUnique({
        where: { id: data.courseId },
      }),
      prisma.tutor.findUnique({
        where: { id: data.tutorId },
      }),
    ])

    if (!course) {
      return { success: false, error: 'Cours introuvable' }
    }

    if (!tutor) {
      return { success: false, error: 'Tuteur introuvable' }
    }

    // Calculate student price using course rate (dual rate system)
    const price = calculateStudentPrice(course.studentRateCad, data.durationMin)

    // Check if slot is still available (not booked or held by someone else)
    const now = new Date()
    const endDatetime = addMinutes(data.startDatetime, data.durationMin)

    const existingHold = await prisma.slotHold.findFirst({
      where: {
        tutorId: data.tutorId,
        startDatetime: data.startDatetime,
        expiresAt: { gt: now },
        userId: { not: user.id },
      },
    })

    if (existingHold) {
      return { success: false, error: "Ce créneau n'est plus disponible" }
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        tutorId: data.tutorId,
        startDatetime: {
          lt: endDatetime,
        },
        endDatetime: {
          gt: data.startDatetime,
        },
        status: { in: ['scheduled', 'completed'] },
      },
    })

    if (existingAppointment) {
      return { success: false, error: "Ce créneau n'est plus disponible" }
    }

    // Create or update cart
    const cart = await getOrCreateCart(user.id)

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) =>
        item.tutorId === data.tutorId &&
        item.startDatetime.getTime() === data.startDatetime.getTime() &&
        item.durationMin === data.durationMin
    )

    if (existingItem) {
      return { success: false, error: 'Cet élément est déjà dans votre panier' }
    }

    // Create cart item and slot hold in a transaction
    await prisma.$transaction(async (tx) => {
      // Create or update slot hold
      await tx.slotHold.upsert({
        where: {
          tutorId_startDatetime: {
            tutorId: data.tutorId,
            startDatetime: data.startDatetime,
          },
        },
        create: {
          userId: user.id,
          tutorId: data.tutorId,
          courseId: data.courseId,
          startDatetime: data.startDatetime,
          durationMin: data.durationMin,
          expiresAt: addMinutes(now, HOLD_TTL_MINUTES),
        },
        update: {
          expiresAt: addMinutes(now, HOLD_TTL_MINUTES),
          durationMin: data.durationMin,
        },
      })

      // Add item to cart
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          courseId: data.courseId,
          tutorId: data.tutorId,
          startDatetime: data.startDatetime,
          durationMin: data.durationMin,
          unitPriceCad: price,
          lineTotalCad: price,
        },
      })
    })

    revalidatePath('/cours')
    revalidatePath('/panier')
    return { success: true }
  } catch (error) {
    console.error('Error adding to cart:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Remove item from cart and release slot hold
 */
export async function removeFromCart(cartItemId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
      },
    })

    if (!cartItem || cartItem.cart.userId !== user.id) {
      return { success: false, error: 'Élément introuvable' }
    }

    // Delete cart item and slot hold in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.delete({
        where: { id: cartItemId },
      })

      await tx.slotHold.deleteMany({
        where: {
          userId: user.id,
          tutorId: cartItem.tutorId,
          startDatetime: cartItem.startDatetime,
        },
      })
    })

    revalidatePath('/cours')
    revalidatePath('/panier')
    return { success: true }
  } catch (error) {
    console.error('Error removing from cart:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Apply coupon to cart
 */
export async function applyCoupon(code: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return { success: false, error: 'Code promo invalide' }
    }

    const validation = validateCoupon(coupon)
    if (!validation.valid) {
      return { success: false, error: validation.reason }
    }

    const cart = await getOrCreateCart(user.id)

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
    })

    revalidatePath('/panier')
    return { success: true }
  } catch (error) {
    console.error('Error applying coupon:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Remove coupon from cart
 */
export async function removeCoupon() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const cart = await getOrCreateCart(user.id)

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    })

    revalidatePath('/panier')
    return { success: true }
  } catch (error) {
    console.error('Error removing coupon:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Extend all holds in cart (refresh TTL)
 */
export async function extendCartHolds() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const cart = await getOrCreateCart(user.id)
    const now = new Date()

    await prisma.slotHold.updateMany({
      where: {
        userId: user.id,
        tutorId: { in: cart.items.map((item) => item.tutorId) },
      },
      data: {
        expiresAt: addMinutes(now, HOLD_TTL_MINUTES),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error extending holds:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


