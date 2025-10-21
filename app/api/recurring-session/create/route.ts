import { NextRequest, NextResponse } from 'next/server'
import { createRecurringSession } from '@/lib/actions/recurring-sessions'
import { getCurrentUser } from '@/lib/actions/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      tutorId,
      courseSlug,
      slot,
      duration,
      frequency,
      totalSessions,
      totalPrice
    } = body

    // Validate required fields
    if (!tutorId || !courseSlug || !slot || !duration || !frequency || !totalSessions) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    // Get course ID from slug
    const course = await prisma.course.findFirst({
      where: { slug: courseSlug }
    })

    if (!course) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 })
    }

    // Create recurring session
    const result = await createRecurringSession({
      tutorId,
      courseId: course.id,
      startDate: new Date(slot.start),
      frequency,
      durationMin: duration,
      totalSessions
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Create a slot hold for the recurring session (similar to regular booking)
    const hold = await prisma.slotHold.create({
      data: {
        userId: currentUser.id,
        tutorId,
        courseId: course.id,
        startDatetime: new Date(slot.start),
        durationMin: duration,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        recurringSessionId: result.recurringSessionId
      }
    })

    return NextResponse.json({
      success: true,
      sessionId: hold.id,
      recurringSessionId: result.recurringSessionId
    })

  } catch (error) {
    console.error('Error creating recurring session:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de la session récurrente' },
      { status: 500 }
    )
  }
}
