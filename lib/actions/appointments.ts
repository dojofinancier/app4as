'use server'

import { prisma } from '@/lib/prisma'
import { sendAppointmentCompletedWebhook } from '@/lib/webhooks/make'

/**
 * Auto-complete past appointments that are still scheduled
 * Updates appointments where endDatetime < now AND status = 'scheduled' to 'completed'
 * Also updates related orderItem earningsStatus to 'earned'
 */
export async function autoCompletePastAppointments() {
  try {
    const now = new Date()

    // Find all scheduled appointments that have passed
    const pastAppointments = await prisma.appointment.findMany({
      where: {
        status: 'scheduled',
        endDatetime: {
          lt: now
        }
      },
      include: {
        orderItem: {
          select: {
            id: true
          }
        }
      }
    })

    if (pastAppointments.length === 0) {
      return { success: true, count: 0 }
    }

    // Update appointments and orderItems in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const appointmentIds = pastAppointments.map(apt => apt.id)
      const orderItemIds = pastAppointments
        .map(apt => apt.orderItem?.id)
        .filter((id): id is string => !!id)

      // Update appointments to completed
      const updatedAppointments = await tx.appointment.updateMany({
        where: {
          id: { in: appointmentIds }
        },
        data: {
          status: 'completed'
        }
      })

      // Update orderItems earningsStatus to 'earned'
      if (orderItemIds.length > 0) {
        await tx.orderItem.updateMany({
          where: {
            id: { in: orderItemIds }
          },
          data: {
            earningsStatus: 'earned'
          }
        })
      }

      return updatedAppointments.count
    })

    // Send completion webhooks for each completed appointment
    try {
      for (const appointment of pastAppointments) {
        const appointmentWithDetails = await prisma.appointment.findUnique({
          where: { id: appointment.id },
          include: {
            user: true,
            tutor: {
              include: { user: true }
            },
            course: true,
            orderItem: true
          }
        })

        if (appointmentWithDetails && appointmentWithDetails.orderItem) {
          await sendAppointmentCompletedWebhook({
            appointmentId: appointmentWithDetails.id,
            userId: appointmentWithDetails.userId,
            tutorId: appointmentWithDetails.tutorId,
            courseId: appointmentWithDetails.courseId,
            courseTitleFr: appointmentWithDetails.course.titleFr,
            startDatetime: appointmentWithDetails.startDatetime.toISOString(),
            endDatetime: appointmentWithDetails.endDatetime.toISOString(),
            durationMin: Math.round((appointmentWithDetails.endDatetime.getTime() - appointmentWithDetails.startDatetime.getTime()) / 60000),
            tutorEarningsCad: Number(appointmentWithDetails.orderItem.tutorEarningsCad),
            completedAt: new Date().toISOString()
          })
        }
      }
    } catch (webhookError) {
      // Don't fail auto-completion if webhooks fail
      console.error('Error sending completion webhooks:', webhookError)
    }

    return { success: true, count: result }
  } catch (error) {
    console.error('Error auto-completing past appointments:', error)
    return { success: false, error: 'Une erreur est survenue', count: 0 }
  }
}
