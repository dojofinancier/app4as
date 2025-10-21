'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function createRecurringSession(data: {
  tutorId: string
  courseId: string
  startDate: Date
  frequency: 'weekly' | 'biweekly'
  durationMin: number
  totalSessions: number
}): Promise<{ success: boolean; error?: string; recurringSessionId?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Validate session count
    if (data.totalSessions < 3 || data.totalSessions > 14) {
      return { success: false, error: 'Le nombre de sessions doit être entre 3 et 14' }
    }

    // Validate duration
    if (![60, 90, 120].includes(data.durationMin)) {
      return { success: false, error: 'La durée doit être de 60, 90 ou 120 minutes' }
    }

    // Validate frequency
    if (!['weekly', 'biweekly'].includes(data.frequency)) {
      return { success: false, error: 'La fréquence doit être "weekly" ou "biweekly"' }
    }

    // Check if tutor exists and is active
    const tutor = await prisma.tutor.findUnique({
      where: { id: data.tutorId },
      include: { user: true }
    })

    if (!tutor || !tutor.active) {
      return { success: false, error: 'Tuteur non trouvé ou inactif' }
    }

    // Check if course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: data.courseId }
    })

    if (!course || !course.active) {
      return { success: false, error: 'Cours non trouvé ou inactif' }
    }

    // Check if tutor teaches this course
    const tutorCourse = await prisma.tutorCourse.findUnique({
      where: {
        tutorId_courseId: {
          tutorId: data.tutorId,
          courseId: data.courseId
        }
      }
    })

    if (!tutorCourse || !tutorCourse.active) {
      return { success: false, error: 'Ce tuteur n\'enseigne pas ce cours' }
    }

    // Calculate end date based on frequency and total sessions
    const endDate = new Date(data.startDate)
    const weeksToAdd = data.frequency === 'weekly' 
      ? (data.totalSessions - 1) 
      : (data.totalSessions - 1) * 2
    
    endDate.setDate(endDate.getDate() + (weeksToAdd * 7))

    // Create recurring session
    const recurringSession = await prisma.recurringSession.create({
      data: {
        userId: currentUser.id,
        tutorId: data.tutorId,
        courseId: data.courseId,
        startDate: data.startDate,
        endDate: endDate,
        frequency: data.frequency,
        durationMin: data.durationMin,
        totalSessions: data.totalSessions
      }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, recurringSessionId: recurringSession.id }
  } catch (error) {
    console.error('Error creating recurring session:', error)
    return { success: false, error: 'Erreur lors de la création de la session récurrente' }
  }
}

export async function getRecurringSessions(): Promise<{ 
  success: boolean; 
  error?: string; 
  sessions?: any[] 
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    const sessions = await prisma.recurringSession.findMany({
      where: { 
        userId: currentUser.id,
        active: true
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        course: {
          select: {
            titleFr: true,
            slug: true
          }
        },
        appointments: {
          where: {
            status: { in: ['scheduled', 'completed'] }
          },
          orderBy: {
            startDatetime: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Serialize dates
    const serializedSessions = sessions.map(session => ({
      ...session,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate?.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      appointments: session.appointments.map(apt => ({
        ...apt,
        startDatetime: apt.startDatetime.toISOString(),
        endDatetime: apt.endDatetime.toISOString()
      }))
    }))

    return { success: true, sessions: serializedSessions }
  } catch (error) {
    console.error('Error fetching recurring sessions:', error)
    return { success: false, error: 'Erreur lors de la récupération des sessions récurrentes' }
  }
}

export async function cancelRecurringSession(
  recurringSessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Find the recurring session
    const recurringSession = await prisma.recurringSession.findFirst({
      where: {
        id: recurringSessionId,
        userId: currentUser.id
      }
    })

    if (!recurringSession) {
      return { success: false, error: 'Session récurrente non trouvée' }
    }

    // Update recurring session to inactive
    await prisma.recurringSession.update({
      where: { id: recurringSessionId },
      data: { active: false }
    })

    // Cancel all future appointments in this recurring session
    const futureAppointments = await prisma.appointment.findMany({
      where: {
        recurringSessionId: recurringSessionId,
        status: 'scheduled',
        startDatetime: {
          gt: new Date()
        }
      }
    })

    // Cancel each future appointment and add credits to user's bank
    for (const appointment of futureAppointments) {
      await prisma.$transaction(async (tx) => {
        // Cancel the appointment
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'cancelled',
            cancellationReason: 'Session récurrente annulée',
            cancelledBy: 'student',
            cancelledAt: new Date()
          }
        })

        // Calculate credit amount (same as appointment duration)
        const creditAmount = appointment.durationMin / 60 // Convert minutes to hours

        // Add credit to user's bank
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            creditBalance: {
              increment: creditAmount
            }
          }
        })

        // Create credit transaction record
        await tx.creditTransaction.create({
          data: {
            userId: currentUser.id,
            appointmentId: appointment.id,
            amount: creditAmount,
            type: 'earned',
            reason: 'Annulation de session récurrente'
          }
        })
      })
    }

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error cancelling recurring session:', error)
    return { success: false, error: 'Erreur lors de l\'annulation de la session récurrente' }
  }
}

export async function getRecurringSessionDetails(
  recurringSessionId: string
): Promise<{ 
  success: boolean; 
  error?: string; 
  session?: any 
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    const session = await prisma.recurringSession.findFirst({
      where: {
        id: recurringSessionId,
        userId: currentUser.id
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        course: {
          select: {
            titleFr: true,
            slug: true
          }
        },
        appointments: {
          orderBy: {
            startDatetime: 'asc'
          }
        }
      }
    })

    if (!session) {
      return { success: false, error: 'Session récurrente non trouvée' }
    }

    // Serialize dates
    const serializedSession = {
      ...session,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate?.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      appointments: session.appointments.map(apt => ({
        ...apt,
        startDatetime: apt.startDatetime.toISOString(),
        endDatetime: apt.endDatetime.toISOString()
      }))
    }

    return { success: true, session: serializedSession }
  } catch (error) {
    console.error('Error fetching recurring session details:', error)
    return { success: false, error: 'Erreur lors de la récupération des détails de la session récurrente' }
  }
}

// Admin function to get all recurring sessions
export async function getAdminRecurringSessions(): Promise<{ 
  success: boolean; 
  error?: string; 
  sessions?: any[] 
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Non autorisé' }
    }

    const sessions = await prisma.recurringSession.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tutor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        course: {
          select: {
            titleFr: true,
            slug: true
          }
        },
        appointments: {
          orderBy: {
            startDatetime: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Serialize dates
    const serializedSessions = sessions.map(session => ({
      ...session,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate?.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      appointments: session.appointments.map(apt => ({
        ...apt,
        startDatetime: apt.startDatetime.toISOString(),
        endDatetime: apt.endDatetime.toISOString()
      }))
    }))

    return { success: true, sessions: serializedSessions }
  } catch (error) {
    console.error('Error fetching admin recurring sessions:', error)
    return { success: false, error: 'Erreur lors de la récupération des sessions récurrentes' }
  }
}

// Function to generate appointments from a recurring session (called after payment)
export async function generateRecurringAppointments(
  recurringSessionId: string,
  orderItemId: string
): Promise<{ success: boolean; error?: string; appointmentsCreated?: number }> {
  try {
    const recurringSession = await prisma.recurringSession.findUnique({
      where: { id: recurringSessionId },
      include: {
        tutor: {
          include: { user: true }
        },
        course: true
      }
    })

    if (!recurringSession) {
      return { success: false, error: 'Session récurrente non trouvée' }
    }

    const appointments = []
    let currentDate = new Date(recurringSession.startDate)
    const endDate = new Date(recurringSession.endDate || new Date())
    
    // Generate all appointment dates
    while (currentDate <= endDate && appointments.length < recurringSession.totalSessions) {
      // Check if this time slot is available
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          tutorId: recurringSession.tutorId,
          startDatetime: currentDate,
          status: { in: ['scheduled', 'completed'] }
        }
      })

      if (!existingAppointment) {
        const endDateTime = new Date(currentDate.getTime() + recurringSession.durationMin * 60000)
        
        appointments.push({
          userId: recurringSession.userId,
          tutorId: recurringSession.tutorId,
          courseId: recurringSession.courseId,
          startDatetime: currentDate,
          endDatetime: endDateTime,
          status: 'scheduled' as const,
          orderItemId: orderItemId,
          recurringSessionId: recurringSessionId
        })
      }

      // Move to next appointment date
      const daysToAdd = recurringSession.frequency === 'weekly' ? 7 : 14
      currentDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
    }

    // Create all appointments in a transaction
    if (appointments.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Create appointments
        await tx.appointment.createMany({
          data: appointments
        })

        // Update recurring session with sessions created count
        await tx.recurringSession.update({
          where: { id: recurringSessionId },
          data: {
            sessionsCreated: appointments.length
          }
        })
      })
    }

    return { success: true, appointmentsCreated: appointments.length }
  } catch (error) {
    console.error('Error generating recurring appointments:', error)
    return { success: false, error: 'Erreur lors de la génération des rendez-vous récurrents' }
  }
}
