'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

/**
 * Create availability rule
 */
export async function createAvailabilityRule(data: {
  weekday: number
  startTime: string
  endTime: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Validate time format and logic
    if (data.startTime >= data.endTime) {
      return { success: false, error: 'L\'heure de fin doit être après l\'heure de début' }
    }

    if (data.weekday < 0 || data.weekday > 6) {
      return { success: false, error: 'Jour de la semaine invalide' }
    }

    // Check for overlapping rules
    const overlappingRule = await prisma.availabilityRule.findFirst({
      where: {
        tutorId: user.id,
        weekday: data.weekday,
        OR: [
          {
            startTime: { lt: data.endTime },
            endTime: { gt: data.startTime },
          },
        ],
      },
    })

    if (overlappingRule) {
      return { success: false, error: 'Cette plage horaire chevauche avec une règle existante' }
    }

    const rule = await prisma.availabilityRule.create({
      data: {
        tutorId: user.id,
        weekday: data.weekday,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: rule }
  } catch (error) {
    console.error('Error creating availability rule:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Update availability rule
 */
export async function updateAvailabilityRule(
  ruleId: string,
  data: {
    weekday?: number
    startTime?: string
    endTime?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const rule = await prisma.availabilityRule.findUnique({
      where: { id: ruleId },
    })

    if (!rule || rule.tutorId !== user.id) {
      return { success: false, error: 'Règle introuvable ou non autorisé' }
    }

    // Validate time logic if both times are provided
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      return { success: false, error: 'L\'heure de fin doit être après l\'heure de début' }
    }

    if (data.weekday !== undefined && (data.weekday < 0 || data.weekday > 6)) {
      return { success: false, error: 'Jour de la semaine invalide' }
    }

    const updatedRule = await prisma.availabilityRule.update({
      where: { id: ruleId },
      data: {
        ...(data.weekday !== undefined && { weekday: data.weekday }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
      },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: updatedRule }
  } catch (error) {
    console.error('Error updating availability rule:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Delete availability rule
 */
export async function deleteAvailabilityRule(ruleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const rule = await prisma.availabilityRule.findUnique({
      where: { id: ruleId },
    })

    if (!rule || rule.tutorId !== user.id) {
      return { success: false, error: 'Règle introuvable ou non autorisé' }
    }

    await prisma.availabilityRule.delete({
      where: { id: ruleId },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error deleting availability rule:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Create availability exception
 */
export async function createAvailabilityException(data: {
  date: string // YYYY-MM-DD format
  startTime: string
  endTime: string
  isOpen: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data.date)) {
      return { success: false, error: 'Format de date invalide (YYYY-MM-DD requis)' }
    }

    // Validate time logic
    if (data.startTime >= data.endTime) {
      return { success: false, error: 'L\'heure de fin doit être après l\'heure de début' }
    }

    // Check for overlapping exceptions
    const overlappingException = await prisma.availabilityException.findFirst({
      where: {
        tutorId: user.id,
        date: data.date,
        OR: [
          {
            startTime: { lt: data.endTime },
            endTime: { gt: data.startTime },
          },
        ],
      },
    })

    if (overlappingException) {
      return { success: false, error: 'Cette plage horaire chevauche avec une exception existante' }
    }

    const exception = await prisma.availabilityException.create({
      data: {
        tutorId: user.id,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        isOpen: data.isOpen,
      },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: exception }
  } catch (error) {
    console.error('Error creating availability exception:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Delete availability exception
 */
export async function deleteAvailabilityException(exceptionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const exception = await prisma.availabilityException.findUnique({
      where: { id: exceptionId },
    })

    if (!exception || exception.tutorId !== user.id) {
      return { success: false, error: 'Exception introuvable ou non autorisé' }
    }

    await prisma.availabilityException.delete({
      where: { id: exceptionId },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error deleting availability exception:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Create time off period
 */
export async function createTimeOff(data: {
  startDatetime: Date
  endDatetime: Date
  description?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Validate date logic
    if (data.startDatetime >= data.endDatetime) {
      return { success: false, error: 'La date de fin doit être après la date de début' }
    }

    // Check for overlapping time off periods
    const overlappingTimeOff = await prisma.timeOff.findFirst({
      where: {
        tutorId: user.id,
        OR: [
          {
            startDatetime: { lt: data.endDatetime },
            endDatetime: { gt: data.startDatetime },
          },
        ],
      },
    })

    if (overlappingTimeOff) {
      return { success: false, error: 'Cette période chevauche avec un congé existant' }
    }

    const timeOff = await prisma.timeOff.create({
      data: {
        tutorId: user.id,
        startDatetime: data.startDatetime,
        endDatetime: data.endDatetime,
      },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: timeOff }
  } catch (error) {
    console.error('Error creating time off:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Delete time off period
 */
export async function deleteTimeOff(timeOffId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const timeOff = await prisma.timeOff.findUnique({
      where: { id: timeOffId },
    })

    if (!timeOff || timeOff.tutorId !== user.id) {
      return { success: false, error: 'Congé introuvable ou non autorisé' }
    }

    await prisma.timeOff.delete({
      where: { id: timeOffId },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error deleting time off:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

