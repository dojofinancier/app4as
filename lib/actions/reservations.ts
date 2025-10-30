'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendBookingRescheduledWebhook } from '@/lib/webhooks/make'
import { autoCompletePastAppointments } from './appointments'

export async function rescheduleAppointment(data: {
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
        course: true
      }
    })

    if (!appointment) {
      return { success: false, error: 'Rendez-vous non trouvé' }
    }

    // Check if user owns this appointment
    if (appointment.userId !== authUser.id) {
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
    const result = await prisma.$transaction(async (tx) => {
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

    // Send webhook notification
    await sendBookingRescheduledWebhook({
      appointmentId: data.appointmentId,
      userId: appointment.userId,
      tutorId: appointment.tutorId,
      courseId: appointment.courseId,
      courseTitleFr: appointment.course.titleFr,
      rescheduledBy: 'student',
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

export async function getStudentAppointments(userId: string) {
  try {
    // Auto-complete past appointments first
    await autoCompletePastAppointments()
    
    console.log('Fetching appointments for user:', userId)
    
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        course: true,
        tutor: {
          include: {
            user: true
          }
        },
        orderItem: true,
        modifications: {
          include: {
            modifier: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { startDatetime: 'asc' }
    })

    console.log('Found appointments with includes:', appointments.length)

    // Serialize the data to make it client-safe
    const serializedAppointments = appointments.map(apt => ({
      ...apt,
      startDatetime: apt.startDatetime.toISOString(),
      endDatetime: apt.endDatetime.toISOString(),
      orderItem: apt.orderItem ? {
        ...apt.orderItem,
        lineTotalCad: Number(apt.orderItem.lineTotalCad)
      } : null,
      modifications: apt.modifications?.map(mod => ({
        ...mod,
        createdAt: mod.createdAt?.toISOString() || new Date().toISOString()
      })) || []
    }))

    return serializedAppointments
  } catch (error) {
    console.error('Error fetching student appointments:', error)
    return []
  }
}

export async function getAvailableRescheduleSlots(appointmentId: string) {
  try {
    // Get the current appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        tutor: true,
        course: true
      }
    })

    if (!appointment) {
      return []
    }

    // Calculate date range (next 30 days from now)
    const now = new Date()
    const fromDate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
    const toDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    // Get tutor's availability
    const tutorAvailability = await prisma.availabilityRule.findMany({
      where: {
        tutorId: appointment.tutorId,
        weekday: {
          in: Array.from({ length: 7 }, (_, i) => i) // All days
        }
      }
    })

    // Get booked slots for this tutor
    const bookedSlots = await prisma.appointment.findMany({
      where: {
        tutorId: appointment.tutorId,
        status: 'scheduled',
        id: { not: appointmentId }, // Exclude current appointment
        startDatetime: {
          gte: fromDate,
          lte: toDate
        }
      }
    })

    // Get slot holds
    const holds = await prisma.slotHold.findMany({
      where: {
        tutorId: appointment.tutorId,
        startDatetime: {
          gte: fromDate,
          lte: toDate
        },
        expiresAt: {
          gt: now
        }
      }
    })

    // Generate available slots
    const availableSlots = []
    const currentDate = new Date(fromDate)
    
    while (currentDate <= toDate) {
      const dayOfWeek = currentDate.getDay()
      const dayAvailability = tutorAvailability.filter(av => av.weekday === dayOfWeek)
      
      for (const availability of dayAvailability) {
        const startTime = new Date(currentDate)
        startTime.setHours(parseInt(availability.startTime.split(':')[0]))
        startTime.setMinutes(parseInt(availability.startTime.split(':')[1]))
        
        const endTime = new Date(currentDate)
        endTime.setHours(parseInt(availability.endTime.split(':')[0]))
        endTime.setMinutes(parseInt(availability.endTime.split(':')[1]))
        
        // Generate 30-minute slots
        let slotStart = new Date(startTime)
        while (slotStart < endTime) {
          const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)
          
          // Check if slot is available
          const isBooked = bookedSlots.some(booked => 
            (slotStart >= booked.startDatetime && slotStart < booked.endDatetime) ||
            (slotEnd > booked.startDatetime && slotEnd <= booked.endDatetime)
          )
          
          const isHeld = holds.some(hold => 
            (slotStart >= hold.startDatetime && slotStart < new Date(hold.startDatetime.getTime() + hold.durationMin * 60 * 1000)) ||
            (slotEnd > hold.startDatetime && slotEnd <= new Date(hold.startDatetime.getTime() + hold.durationMin * 60 * 1000))
          )
          
          if (!isBooked && !isHeld && slotStart > now) {
            availableSlots.push({
              startDatetime: slotStart.toISOString(),
              endDatetime: slotEnd.toISOString(),
              displayTime: slotStart.toLocaleTimeString('fr-CA', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })
            })
          }
          
          slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000)
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return availableSlots
  } catch (error) {
    console.error('Error fetching available reschedule slots:', error)
    return []
  }
}

export async function updateMeetingLink(data: {
  appointmentId: string
  meetingLink: string
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Get the appointment to verify the user is the tutor
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        tutor: true
      }
    })

    if (!appointment) {
      return { success: false, error: 'Rendez-vous non trouvé' }
    }

    // Check if the current user is the tutor for this appointment
    if (appointment.tutorId !== authUser.id) {
      return { success: false, error: 'Non autorisé - vous n\'êtes pas le tuteur de ce rendez-vous' }
    }

    // Validate meeting link format (basic URL validation)
    if (data.meetingLink && !isValidUrl(data.meetingLink)) {
      return { success: false, error: 'Format de lien invalide' }
    }

    // Update the meeting link
    await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: {
        meetingLink: data.meetingLink || null
      }
    })

    revalidatePath('/tuteur/tableau-de-bord')
    revalidatePath('/tableau-de-bord')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating meeting link:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// Helper function to validate URLs
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}
