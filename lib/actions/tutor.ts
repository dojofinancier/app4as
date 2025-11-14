'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendBookingCancelledWebhook } from '@/lib/webhooks/make'
import { CANCELLATION_CUTOFF_HOURS } from '@/lib/slots/types'
import { addMinutes } from 'date-fns'
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
export async function rescheduleTutorAppointment(
  appointmentId: string,
  newStartDatetime: Date,
  newDurationMin: number
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
        error: 'Ce rendez-vous ne peut pas être reprogrammé',
      }
    }

    // Check if within rescheduling window
    const now = new Date()
    const cutoffTime = new Date(
      appointment.startDatetime.getTime() -
        CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000
    )

    if (now > cutoffTime) {
      return {
        success: false,
        error: 'Reprogrammation trop tardive. Contactez le support si nécessaire.',
      }
    }

    const newEndDatetime = addMinutes(newStartDatetime, newDurationMin)

    // Check for conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        tutorId: appointment.tutorId,
        id: { not: appointmentId },
        startDatetime: { lt: newEndDatetime },
        endDatetime: { gt: newStartDatetime },
        status: { in: ['scheduled', 'completed'] },
      },
    })

    if (conflictingAppointment) {
      return {
        success: false,
        error: 'Ce créneau est déjà occupé',
      }
    }

    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startDatetime: newStartDatetime,
        endDatetime: newEndDatetime,
      },
    })

    // Future enhancements:
    // - Send email notification to student about reschedule
    // - Update order item pricing if duration changed (recalculate tutor earnings)

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error rescheduling appointment:', error)
    return { success: false, error: 'Une erreur est survenue' }
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

