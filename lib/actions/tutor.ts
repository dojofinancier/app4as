'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendBookingCancelledWebhook, sendBookingRescheduledWebhook } from '@/lib/webhooks/make'
import { CANCELLATION_CUTOFF_HOURS } from '@/lib/slots/types'
import type { AppointmentStatus } from '@prisma/client'

/**
 * Get tutor profile by user ID
 */
export async function getTutorProfile(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const tutor = await prisma.tutor.findUnique({
      where: { id: userId },
      include: {
        user: true,
        tutorCourses: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!tutor) {
      return { success: false, error: 'Profil tuteur introuvable' }
    }

    return { success: true, data: tutor }
  } catch (error) {
    console.error('Error fetching tutor profile:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get tutor appointments with optional filters
 */
export async function getTutorAppointments(
  tutorId: string,
  filters?: {
    status?: AppointmentStatus[]
    fromDate?: Date
    toDate?: Date
    limit?: number
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== tutorId) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const whereClause: any = {
      tutorId,
    }

    if (filters?.status) {
      whereClause.status = { in: filters.status }
    }

    if (filters?.fromDate || filters?.toDate) {
      whereClause.startDatetime = {}
      if (filters.fromDate) {
        whereClause.startDatetime.gte = filters.fromDate
      }
      if (filters.toDate) {
        whereClause.startDatetime.lte = filters.toDate
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        course: {
          select: {
            id: true,
            titleFr: true,
            slug: true,
          },
        },
        orderItem: {
          select: {
            unitPriceCad: true,
            lineTotalCad: true,
          },
        },
      },
      orderBy: { startDatetime: 'asc' },
      take: filters?.limit || 50,
    })

    return { success: true, data: appointments }
  } catch (error) {
    console.error('Error fetching tutor appointments:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Update tutor profile
 */
export async function updateTutorProfile(data: {
  displayName?: string
  bioFr?: string
  hourlyBaseRateCad?: number
  priority?: number
  active?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const updatedTutor = await prisma.tutor.update({
      where: { id: user.id },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.bioFr && { bioFr: data.bioFr }),
        ...(data.hourlyBaseRateCad && { hourlyBaseRateCad: data.hourlyBaseRateCad }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.active !== undefined && { active: data.active }),
      },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: updatedTutor }
  } catch (error) {
    console.error('Error updating tutor profile:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Cancel appointment as tutor
 */
export async function cancelTutorAppointment(
  appointmentId: string,
  reason?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: true,
        course: true,
      },
    })

    if (!appointment) {
      return { success: false, error: 'Rendez-vous introuvable' }
    }

    if (appointment.tutorId !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    if (appointment.status !== 'scheduled') {
      return {
        success: false,
        error: 'Ce rendez-vous ne peut pas être annulé',
      }
    }

    // Check if within cancellation window (tutors have more flexibility)
    const now = new Date()
    const cutoffTime = new Date(
      appointment.startDatetime.getTime() -
        CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000
    )

    if (now > cutoffTime) {
      return {
        success: false,
        error: 'Annulation trop tardive. Contactez le support si nécessaire.',
      }
    }

    // Update appointment status and cancel tutor earnings
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        status: 'cancelled',
        cancellationReason: reason || 'Annulé par tuteur',
        cancelledBy: user.id,
        cancelledAt: new Date()
      },
      include: {
        orderItem: {
          select: {
            id: true
          }
        }
      }
    })

    // Cancel tutor earnings for this appointment
    if (updatedAppointment.orderItem) {
      await prisma.orderItem.update({
        where: { id: updatedAppointment.orderItem.id },
        data: {
          earningsStatus: 'cancelled'
        }
      })
    }

    // Fetch student and tutor emails for webhook
    const [student, tutor] = await Promise.all([
      prisma.user.findUnique({ where: { id: appointment.userId }, select: { email: true } }),
      prisma.user.findUnique({ where: { id: appointment.tutorId }, select: { email: true } })
    ])

    // Send cancellation webhook
    try {
      await sendBookingCancelledWebhook({
        appointmentId: appointment.id,
        userId: appointment.userId,
        tutorId: appointment.tutorId,
        studentEmail: student?.email || '',
        tutorEmail: tutor?.email || '',
        courseId: appointment.courseId,
        courseTitleFr: appointment.course.titleFr,
        cancelledBy: 'tutor',
        cancelledById: user.id,
        cancellationReason: reason || 'Annulé par tuteur',
        startDatetime: appointment.startDatetime.toISOString(),
        endDatetime: appointment.endDatetime.toISOString(),
        durationMin: Math.round((appointment.endDatetime.getTime() - appointment.startDatetime.getTime()) / 60000),
        priceCad: 0, // Will need to fetch from orderItem if needed
        timestamp: new Date().toISOString()
      })
    } catch (webhookError) {
      // Don't fail cancellation if webhook fails
      console.error('Error sending cancellation webhook:', webhookError)
    }

    // Future enhancements:
    // - Send email notification to student about cancellation
    // - Process refund if cancellation is within refund policy window
    // - Update order status if needed

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Reschedule appointment as tutor
 */
export async function rescheduleTutorAppointment(data: {
  appointmentId: string
  newStartDatetime: Date
  newEndDatetime: Date
  reason: string
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        user: true,
        tutor: { include: { user: true } },
        course: true,
      },
    })

    if (!appointment) {
      return { success: false, error: 'Rendez-vous non trouvé' }
    }

    // Check if tutor owns this appointment
    if (appointment.tutorId !== authUser.id) {
      return { success: false, error: 'Non autorisé' }
    }

    // Check if appointment is in the future
    const now = new Date()
    if (appointment.startDatetime <= now) {
      return { success: false, error: 'Impossible de reprogrammer un rendez-vous passé' }
    }

    // Check 2-hour rescheduling policy
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    if (appointment.startDatetime <= twoHoursFromNow) {
      return { success: false, error: 'Impossible de reprogrammer moins de 2 heures avant le rendez-vous' }
    }

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      return { success: false, error: 'Ce rendez-vous est annulé et ne peut pas être reprogrammé' }
    }

    // Check if new time slot is available
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        tutorId: appointment.tutorId,
        status: 'scheduled',
        id: { not: data.appointmentId },
        OR: [
          {
            startDatetime: {
              gte: data.newStartDatetime,
              lt: data.newEndDatetime
            }
          },
          {
            endDatetime: {
              gt: data.newStartDatetime,
              lte: data.newEndDatetime
            }
          }
        ]
      }
    })

    if (conflictingAppointment) {
      return { success: false, error: 'Ce créneau n\'est pas disponible' }
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Update appointment
      const updatedAppointment = await tx.appointment.update({
        where: { id: data.appointmentId },
        data: {
          startDatetime: data.newStartDatetime,
          endDatetime: data.newEndDatetime
        }
      })

      // Log the modification
      await tx.appointmentModification.create({
        data: {
          appointmentId: data.appointmentId,
          modifiedBy: authUser.id,
          modificationType: 'reschedule',
          reason: data.reason,
          oldData: {
            startDatetime: appointment.startDatetime,
            endDatetime: appointment.endDatetime
          },
          newData: {
            startDatetime: data.newStartDatetime,
            endDatetime: data.newEndDatetime
          }
        }
      })

      return updatedAppointment
    })

    // Fetch student and tutor emails for webhook
    const [student, tutor] = await Promise.all([
      prisma.user.findUnique({ where: { id: appointment.userId }, select: { email: true } }),
      prisma.user.findUnique({ where: { id: appointment.tutorId }, select: { email: true } })
    ])

    // Send webhook notification
    await sendBookingRescheduledWebhook({
      appointmentId: data.appointmentId,
      userId: appointment.userId,
      tutorId: appointment.tutorId,
      studentEmail: student?.email || '',
      tutorEmail: tutor?.email || '',
      courseId: appointment.courseId,
      courseTitleFr: appointment.course.titleFr,
      rescheduledBy: 'tutor',
      rescheduledById: authUser.id,
      reason: data.reason,
      oldStartDatetime: appointment.startDatetime.toISOString(),
      oldEndDatetime: appointment.endDatetime.toISOString(),
      newStartDatetime: data.newStartDatetime.toISOString(),
      newEndDatetime: data.newEndDatetime.toISOString(),
      timestamp: new Date().toISOString()
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error rescheduling appointment:', error)
    return { success: false, error: 'Erreur lors de la reprogrammation du rendez-vous' }
  }
}

/**
 * Get tutor availability rules
 */
export async function getTutorAvailability(tutorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== tutorId) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const [rules, exceptions, timeOffs] = await Promise.all([
      prisma.availabilityRule.findMany({
        where: { tutorId },
        orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.availabilityException.findMany({
        where: { tutorId },
        orderBy: { startDate: 'asc' },
      }),
      prisma.timeOff.findMany({
        where: { tutorId },
        orderBy: { startDatetime: 'asc' },
      }),
    ])

    return { success: true, data: { rules, exceptions, timeOffs } }
  } catch (error) {
    console.error('Error fetching tutor availability:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

