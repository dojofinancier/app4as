import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Booking Session GET API Called ===')
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    console.log('Session ID:', sessionId)

    if (!sessionId) {
      console.log('No session ID provided')
      return NextResponse.json(
        { error: 'ID de session manquant' },
        { status: 400 }
      )
    }

    // Validate sessionId is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { error: 'ID de session invalide' },
        { status: 400 }
      )
    }

    // Load from DB: treat sessionId as holdId
    console.log('Looking for hold with ID:', sessionId)
    const hold = await prisma.slotHold.findUnique({ where: { id: sessionId } })
    console.log('Hold found:', hold ? 'Yes' : 'No')
    
    if (!hold) {
      console.log('Hold not found')
      return NextResponse.json(
        { error: 'Session introuvable' },
        { status: 404 }
      )
    }

    if (hold.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session expirée' },
        { status: 410 }
      )
    }

    const [course, tutor] = await Promise.all([
      prisma.course.findUnique({ where: { id: hold.courseId } }),
      prisma.tutor.findUnique({ 
        where: { id: hold.tutorId },
        include: { user: true }
      })
    ])
    
    // Get recurring session info if this is a recurring booking
    let recurringSession = null
    if (hold.recurringSessionId) {
      recurringSession = await prisma.recurringSession.findUnique({
        where: { id: hold.recurringSessionId },
        include: {
          tutor: {
            include: { user: true }
          }
        }
      })
    }
    
    const session = {
      id: sessionId,
      tutorId: hold.tutorId,
      tutorName: tutor?.displayName || 'Tuteur',
      tutorRate: tutor?.hourlyBaseRateCad || 50,
      courseSlug: course?.slug || '',
      slot: {
        start: hold.startDatetime.toISOString(),
        end: new Date(hold.startDatetime.getTime() + hold.durationMin * 60000).toISOString()
      },
      duration: hold.durationMin,
      holdId: hold.id,
      recurringSessionId: hold.recurringSessionId,
      recurringSession: recurringSession ? {
        id: recurringSession.id,
        frequency: recurringSession.frequency,
        totalSessions: recurringSession.totalSessions,
        startDate: recurringSession.startDate.toISOString(),
        endDate: recurringSession.endDate?.toISOString()
      } : null,
      userInfo: { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' },
      billingAddress: { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'CA' },
      createdAt: new Date(),
      expiresAt: hold.expiresAt
    }
    
    console.log('Returning session:', session)
    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error getting booking session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la session' },
      { status: 500 }
    )
  }
}
