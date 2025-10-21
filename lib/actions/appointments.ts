'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { CANCELLATION_CUTOFF_HOURS } from '@/lib/slots/types'

/**
 * Cancel an appointment (if within allowed time window)
 */
export async function cancelAppointment(appointmentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment) {
      return { success: false, error: 'Rendez-vous introuvable' }
    }

    if (appointment.userId !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    if (appointment.status !== 'scheduled') {
      return {
        success: false,
        error: 'Ce rendez-vous ne peut pas être annulé',
      }
    }

    // Check if within cancellation window
    const now = new Date()
    const cutoffTime = new Date(
      appointment.startDatetime.getTime() -
        CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000
    )

    if (now > cutoffTime) {
      return {
        success: false,
        error: frCA.errors.cannotCancelLate,
      }
    }

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'cancelled' },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// Import frCA for error message
import { frCA } from '@/lib/i18n/fr-CA'


