import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tutorId, courseSlug, slot, duration } = body

    // Validate required fields
    if (!tutorId || !courseSlug || !slot || !duration) {
      return NextResponse.json(
        { error: 'Données de réservation manquantes' },
        { status: 400 }
      )
    }

    // Validate tutor and course
    const [tutor, course] = await Promise.all([
      prisma.tutor.findUnique({ where: { id: tutorId } }),
      prisma.course.findFirst({ where: { slug: courseSlug } })
    ])

    if (!tutor || !course) {
      return NextResponse.json(
        { error: 'Tuteur ou cours introuvable' },
        { status: 404 }
      )
    }

    // Validate duration
    if (![60, 90, 120].includes(duration)) {
      return NextResponse.json(
        { error: 'Durée invalide' },
        { status: 400 }
      )
    }

    // Validate slot shape
    const start = new Date(slot.start)
    const end = new Date(slot.end)
    if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Créneau invalide' },
        { status: 400 }
      )
    }

    // Get the current user (student making the booking) - can be null for guest users
    const currentUser = await getCurrentUser()
    
    let userId: string
    if (currentUser) {
      userId = currentUser.id
      console.log('Creating booking session for logged-in user:', userId, 'for tutor:', tutorId)
    } else {
      // For guest users, create a temporary user record
      console.log('Creating temporary user for guest booking')
      const tempUser = await prisma.user.create({
        data: {
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: `temp_${Date.now()}@guest.com`,
          firstName: 'Guest',
          lastName: 'User',
          role: 'student'
        }
      })
      userId = tempUser.id
      console.log('Created temporary user:', userId, 'for tutor:', tutorId)
    }

    // Clean expired holds and create a new hold in a transaction
    const hold = await prisma.$transaction(async (tx) => {
      // Cleanup expired holds and their associated temporary users
      const expiredHolds = await tx.slotHold.findMany({
        where: { expiresAt: { lt: new Date() } },
        select: { userId: true }
      })
      
      // Delete expired holds
      await tx.slotHold.deleteMany({ where: { expiresAt: { lt: new Date() } } })
      
      // Clean up temporary users that are no longer associated with any holds
      const expiredUserIds = expiredHolds.map(h => h.userId).filter(id => id.startsWith('guest_'))
      if (expiredUserIds.length > 0) {
        await tx.user.deleteMany({
          where: {
            id: { in: expiredUserIds },
            slotHolds: { none: {} } // Only delete if no remaining slot holds
          }
        })
      }

      // Prevent conflicts with appointments
      const conflict = await tx.appointment.findFirst({
        where: {
          tutorId: tutorId,
          startDatetime: { lt: end },
          endDatetime: { gt: start }
        }
      })
      if (conflict) {
        throw new Error('Ce créneau est déjà réservé. Veuillez choisir un autre horaire.')
      }

      // Prevent conflicts with existing non-expired holds
      const existingHold = await tx.slotHold.findFirst({
        where: {
          tutorId: tutorId,
          startDatetime: start,
          expiresAt: { gt: new Date() }
        }
      })
      if (existingHold) {
        throw new Error('Ce créneau est déjà réservé. Veuillez choisir un autre horaire.')
      }

      // Create hold; bind to the user making the booking (logged-in or temporary)
      return await tx.slotHold.create({
        data: {
          tutorId: tutorId,
          courseId: course.id,
          startDatetime: start,
          durationMin: duration,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          userId: userId  // Use the real user ID (logged-in or temporary)
        }
      })
    })

    // Return the hold ID as sessionId (DB-backed, survives server reloads)
    return NextResponse.json({ sessionId: hold.id })
  } catch (error) {
    console.error('Error creating booking session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
