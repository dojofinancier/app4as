'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { addMinutes } from 'date-fns'
import { calculateStudentPrice, validateCoupon, isCouponExpired } from '@/lib/pricing'
import type { Duration } from '@/lib/slots/types'
import { getCartSessionId, getOrCreateCartSessionId } from '@/lib/utils/session'

const HOLD_TTL_MINUTES = 15

/**
 * Get or create cart for current user
 */
export async function getOrCreateCartByIdentity(args: { userId?: string; sessionId?: string }) {
  const { userId, sessionId } = args
  if (!userId && !sessionId) {
    throw new Error('Missing identity for cart retrieval')
  }

  // Try by userId first if present
  let cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionId: sessionId! },
    include: {
      items: { include: { course: true, tutor: true } },
      coupon: true,
    },
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { sessionId: sessionId! },
      include: {
        items: { include: { course: true, tutor: true } },
        coupon: true,
      },
    })
  }

  // CRITICAL: Filter out cart items that are already booked as appointments
  // This prevents showing booked slots in cart after logout/login
  if (cart.items.length > 0) {
    const itemTutorIds = cart.items.map(item => item.tutorId)
    const itemStartTimes = cart.items.map(item => item.startDatetime)
    
    // Get all appointments that overlap with cart items
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        tutorId: { in: itemTutorIds },
        status: { in: ['scheduled', 'completed'] },
        OR: cart.items.map(item => ({
          AND: [
            { tutorId: item.tutorId },
            { startDatetime: { lt: addMinutes(item.startDatetime, item.durationMin) } },
            { endDatetime: { gt: item.startDatetime } },
          ],
        })),
      },
      select: {
        tutorId: true,
        startDatetime: true,
        endDatetime: true,
      },
    })

    // Check which cart items are already booked
    const bookedItemIds: string[] = []
    for (const item of cart.items) {
      const itemEnd = addMinutes(item.startDatetime, item.durationMin)
      const isBooked = bookedAppointments.some(apt => 
        apt.tutorId === item.tutorId &&
        apt.startDatetime < itemEnd &&
        apt.endDatetime > item.startDatetime
      )
      
      if (isBooked) {
        bookedItemIds.push(item.id)
      }
    }

    // Remove booked items from cart
    if (bookedItemIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Delete cart items
        await tx.cartItem.deleteMany({
          where: { id: { in: bookedItemIds } },
        })
        
        // Delete associated holds
        await tx.slotHold.deleteMany({
          where: {
            tutorId: { in: itemTutorIds },
            startDatetime: { in: itemStartTimes },
            ...(userId ? { userId } : { sessionId: sessionId! }),
          },
        })
      })

      // Refresh cart after cleanup
      cart = await prisma.cart.findFirst({
        where: userId ? { userId } : { sessionId: sessionId! },
        include: {
          items: { include: { course: true, tutor: true } },
          coupon: true,
        },
      }) || cart
      
      // Clear items if cart was deleted
      if (!cart) {
        cart = await prisma.cart.create({
          data: userId ? { userId } : { sessionId: sessionId! },
          include: {
            items: { include: { course: true, tutor: true } },
            coupon: true,
          },
        })
      }
    }
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

  // Determine identity (user or guest session)
  let identity: { userId?: string; sessionId?: string }
  if (user) {
    identity = { userId: user.id }
  } else {
    const existing = await getCartSessionId() || await getOrCreateCartSessionId()
    identity = { sessionId: existing }
    // Set session id for RLS policies (if configured)
    try {
      await prisma.$executeRaw`select set_config('app.cart_session_id', ${existing}, true)`
    } catch (e) {
      // ignore if not configured
    }
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
        OR: [
          identity.userId ? { userId: { not: identity.userId } } : {},
          identity.sessionId ? { sessionId: { not: identity.sessionId } } : {},
        ],
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
    const cart = await getOrCreateCartByIdentity(identity)

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
          userId: identity.userId ?? null,
          sessionId: identity.sessionId ?? null,
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
export async function removeFromCart(cartItemId: string, sessionId?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Determine identity (user or guest session)
  let identity: { userId?: string; sessionId?: string }
  if (user) {
    identity = { userId: user.id }
  } else {
    // Use provided sessionId or try to get from server-side cookies as fallback
    const existing = sessionId || await getCartSessionId()
    if (!existing) {
      return { success: false, error: 'Session de panier introuvable' }
    }
    identity = { sessionId: existing }
    // Set session id for RLS policies (if configured)
    try {
      await prisma.$executeRaw`select set_config('app.cart_session_id', ${existing}, true)`
    } catch (e) {
      // ignore if not configured
    }
  }

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
      },
    })

    if (!cartItem) {
      return { success: false, error: 'Élément introuvable' }
    }

    // Check if the cart belongs to the current user/session
    const cartBelongsToUser = identity.userId 
      ? cartItem.cart.userId === identity.userId
      : cartItem.cart.sessionId === identity.sessionId

    if (!cartBelongsToUser) {
      return { success: false, error: 'Élément introuvable' }
    }

    // Delete cart item and slot hold in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.delete({
        where: { id: cartItemId },
      })

      // Delete slot hold - use the appropriate identity
      await tx.slotHold.deleteMany({
        where: {
          ...(identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId }),
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

    // Check if coupon is expired and deactivate it
    if (isCouponExpired(coupon)) {
      // Deactivate expired coupon
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { active: false }
      })
      return { success: false, error: 'Ce code promo a expiré' }
    }

    const cart = await getOrCreateCartByIdentity({ userId: user.id })

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
 * Apply coupon to guest cart
 */
export async function applyCouponGuest(code: string, sessionId: string) {
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

    // Check if coupon is expired and deactivate it
    if (isCouponExpired(coupon)) {
      // Deactivate expired coupon
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { active: false }
      })
      return { success: false, error: 'Ce code promo a expiré' }
    }

    const cart = await getOrCreateCartByIdentity({ sessionId })

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
    const cart = await getOrCreateCartByIdentity({ userId: user.id })

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
 * Remove coupon from guest cart
 */
export async function removeCouponGuest(sessionId: string) {
  try {
    const cart = await getOrCreateCartByIdentity({ sessionId })

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
 * Batch add items to cart - optimized version
 * Accepts course data to avoid re-fetching, processes all sessions in one transaction
 */
export async function addToCartBatch(data: {
  courseId: string
  courseStudentRateCad: number // Pass course rate to avoid fetch
  sessions: Array<{
    tutorId: string
    startDatetime: Date
    durationMin: Duration
  }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Determine identity (user or guest session)
  let identity: { userId?: string; sessionId?: string }
  if (user) {
    identity = { userId: user.id }
  } else {
    const existing = await getCartSessionId() || await getOrCreateCartSessionId()
    identity = { sessionId: existing }
    // Set session id for RLS policies (if configured)
    try {
      await prisma.$executeRaw`select set_config('app.cart_session_id', ${existing}, true)`
    } catch (e) {
      // ignore if not configured
    }
  }

  if (data.sessions.length === 0) {
    return { success: false, error: 'Aucune session à ajouter' }
  }

  try {
    const now = new Date()

    // Get all unique tutor IDs to fetch tutors in one query
    const uniqueTutorIds = [...new Set(data.sessions.map(s => s.tutorId))]
    
    // Fetch all tutors in parallel (optimization #5)
    const tutors = await prisma.tutor.findMany({
      where: { id: { in: uniqueTutorIds } },
      select: { id: true }, // Only select ID (optimization #5)
    })

    if (tutors.length !== uniqueTutorIds.length) {
      return { success: false, error: 'Un ou plusieurs tuteurs sont introuvables' }
    }

    // Calculate prices for all sessions
    const sessionsWithPrices = data.sessions.map(session => {
      const price = calculateStudentPrice(data.courseStudentRateCad, session.durationMin)
      const endDatetime = addMinutes(session.startDatetime, session.durationMin)
      return {
        ...session,
        price,
        endDatetime,
      }
    })

    // Get or create cart once (optimization #5)
    const cart = await getOrCreateCartByIdentity(identity)

    // Check for existing cart items (avoid duplicates)
    const existingCartItems = cart.items.map(item => ({
      tutorId: item.tutorId,
      startDatetime: item.startDatetime.getTime(),
      durationMin: item.durationMin,
    }))

    // Filter out sessions that already exist in cart
    const newSessions = sessionsWithPrices.filter(session => {
      return !existingCartItems.some(existing => 
        existing.tutorId === session.tutorId &&
        existing.startDatetime === session.startDatetime.getTime() &&
        existing.durationMin === session.durationMin
      )
    })

    if (newSessions.length === 0) {
      return { success: false, error: 'Toutes les sessions sont déjà dans votre panier' }
    }

    // Build combined conflict check query (optimization #5)
    // Check for holds and appointments in parallel for all sessions
    const allStartTimes = newSessions.map(s => s.startDatetime)
    const allTutorIds = newSessions.map(s => s.tutorId)

    // Check for existing holds (combine all checks in one query)
    const existingHolds = await prisma.slotHold.findMany({
      where: {
        tutorId: { in: allTutorIds },
        startDatetime: { in: allStartTimes },
        expiresAt: { gt: now },
        OR: [
          identity.userId ? { userId: { not: identity.userId } } : {},
          identity.sessionId ? { sessionId: { not: identity.sessionId } } : {},
        ],
      },
      select: { tutorId: true, startDatetime: true },
    })

    // Check for existing appointments (combine all checks in one query)
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        tutorId: { in: allTutorIds },
        status: { in: ['scheduled', 'completed'] },
        OR: newSessions.map(session => ({
          AND: [
            { tutorId: session.tutorId },
            { startDatetime: { lt: session.endDatetime } },
            { endDatetime: { gt: session.startDatetime } },
          ],
        })),
      },
      select: { tutorId: true, startDatetime: true, endDatetime: true },
    })

    // Create conflict maps for quick lookup
    const holdConflictMap = new Map(
      existingHolds.map(h => [`${h.tutorId}-${h.startDatetime.getTime()}`, true])
    )
    
    const appointmentConflictMap = new Map(
      existingAppointments.map(a => [a.tutorId, true])
    )

    // Filter out conflicted sessions
    const validSessions = newSessions.filter(session => {
      const holdKey = `${session.tutorId}-${session.startDatetime.getTime()}`
      if (holdConflictMap.has(holdKey)) return false
      if (appointmentConflictMap.has(session.tutorId)) {
        // Check if appointment actually overlaps
        const overlapping = existingAppointments.some(apt => {
          return apt.tutorId === session.tutorId &&
            apt.startDatetime < session.endDatetime &&
            apt.endDatetime > session.startDatetime
        })
        return !overlapping
      }
      return true
    })

    if (validSessions.length === 0) {
      return { 
        success: false, 
        error: 'Aucune session n\'est disponible (créneaux déjà réservés)' 
      }
    }

    // Process all valid sessions in a single transaction
    await prisma.$transaction(async (tx) => {
      // Create all slot holds
      await Promise.all(
        validSessions.map(session =>
          tx.slotHold.upsert({
            where: {
              tutorId_startDatetime: {
                tutorId: session.tutorId,
                startDatetime: session.startDatetime,
              },
            },
            create: {
              userId: identity.userId ?? null,
              sessionId: identity.sessionId ?? null,
              tutorId: session.tutorId,
              courseId: data.courseId,
              startDatetime: session.startDatetime,
              durationMin: session.durationMin,
              expiresAt: addMinutes(now, HOLD_TTL_MINUTES),
            },
            update: {
              expiresAt: addMinutes(now, HOLD_TTL_MINUTES),
              durationMin: session.durationMin,
            },
          })
        )
      )

      // Create all cart items
      await Promise.all(
        validSessions.map(session =>
          tx.cartItem.create({
            data: {
              cartId: cart.id,
              courseId: data.courseId,
              tutorId: session.tutorId,
              startDatetime: session.startDatetime,
              durationMin: session.durationMin,
              unitPriceCad: session.price,
              lineTotalCad: session.price,
            },
          })
        )
      )
    })

    revalidatePath('/cours')
    revalidatePath('/panier')
    
    return { 
      success: true, 
      added: validSessions.length,
      skipped: newSessions.length - validSessions.length,
    }
  } catch (error) {
    console.error('Error adding to cart batch:', error)
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
    const cart = await getOrCreateCartByIdentity({ userId: user.id })
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


