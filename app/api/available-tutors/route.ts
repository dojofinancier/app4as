import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get tutors that the current user has appointments with
    const tutorsWithAppointments = await prisma.appointment.findMany({
      where: {
        userId: currentUser.id,
        status: { in: ['scheduled', 'completed'] }
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }
      },
      distinct: ['tutorId']
    })

    // Group by tutor and count appointments
    const tutorMap = new Map()
    tutorsWithAppointments.forEach(apt => {
      const tutorId = apt.tutorId
      if (!tutorMap.has(tutorId)) {
        tutorMap.set(tutorId, {
          id: apt.tutor.user.id,
          firstName: apt.tutor.user.firstName,
          lastName: apt.tutor.user.lastName,
          role: apt.tutor.user.role,
          appointmentCount: 0
        })
      }
      tutorMap.get(tutorId).appointmentCount++
    })

    const availableTutors = Array.from(tutorMap.values())

    return NextResponse.json(availableTutors)
  } catch (error) {
    console.error('Error fetching available tutors:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}
