'use server'

import { revalidatePath, unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { CACHE_TTL, CACHE_TAGS } from '@/lib/utils/cache'
import { set } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/Toronto'

export interface AvailabilityRule {
  id: string
  tutorId: string
  weekday: number
  startTime: string
  endTime: string
}

export interface AvailabilityException {
  id: string
  tutorId: string
  startDate: string
  endDate: string
  isUnavailable: boolean
}

export async function getTutorAvailabilityRules(tutorId: string): Promise<AvailabilityRule[]> {
  try {
    // Cached function to fetch availability rules (5 minutes TTL)
    const getCachedRules = unstable_cache(
      async () => {
        return await prisma.availabilityRule.findMany({
          where: { tutorId },
          orderBy: [
            { weekday: 'asc' },
            { startTime: 'asc' }
          ],
          select: {
            id: true,
            tutorId: true,
            weekday: true,
            startTime: true,
            endTime: true,
          },
        })
      },
      [`availability-rules-${tutorId}`],
      {
        revalidate: CACHE_TTL.AVAILABILITY_RULES,
        tags: [CACHE_TAGS.AVAILABILITY_RULES(tutorId)],
      }
    )
    
    const rules = await getCachedRules()
    return rules.map(rule => ({
      id: rule.id,
      tutorId: rule.tutorId,
      weekday: rule.weekday,
      startTime: rule.startTime,
      endTime: rule.endTime
    }))
  } catch (error) {
    console.error('Error fetching availability rules:', error)
    return []
  }
}

export async function getTutorAvailabilityExceptions(tutorId: string): Promise<AvailabilityException[]> {
  try {
    const exceptions = await prisma.availabilityException.findMany({
      where: { tutorId },
      orderBy: { startDate: 'asc' }
    })

    return exceptions.map(exception => ({
      id: exception.id,
      tutorId: exception.tutorId,
      startDate: exception.startDate.toISOString().split('T')[0],
      endDate: exception.endDate.toISOString().split('T')[0],
      isUnavailable: exception.isUnavailable
    }))
  } catch (error) {
    console.error('Error fetching availability exceptions:', error)
    return []
  }
}

export async function saveAvailabilityRules(
  tutorId: string, 
  rules: Omit<AvailabilityRule, 'id'>[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Verify user is the tutor
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: { user: true }
    })

    if (!tutor || tutor.user.id !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    // Validate rules for overlaps
    const validationError = validateAvailabilityRules(rules)
    if (validationError) {
      return { success: false, error: validationError }
    }

    // Check for conflicts with existing appointments
    const conflictError = await checkAvailabilityConflicts(tutorId, rules)
    if (conflictError) {
      return { success: false, error: conflictError }
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete existing rules
      await tx.availabilityRule.deleteMany({
        where: { tutorId }
      })

      // Insert new rules
      await tx.availabilityRule.createMany({
        data: rules.map(rule => ({
          tutorId: rule.tutorId,
          weekday: rule.weekday,
          startTime: rule.startTime,
          endTime: rule.endTime
        }))
      })
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error saving availability rules:', error)
    return { success: false, error: 'Erreur lors de la sauvegarde des disponibilités' }
  }
}

export async function saveAvailabilityExceptions(
  tutorId: string,
  exceptions: Omit<AvailabilityException, 'id'>[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    // Verify user is the tutor
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: { user: true }
    })

    if (!tutor || tutor.user.id !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    // Validate exceptions
    const validationError = validateAvailabilityExceptions(exceptions)
    if (validationError) {
      return { success: false, error: validationError }
    }

    // Check for conflicts with existing appointments
    const conflictError = await checkExceptionConflicts(tutorId, exceptions)
    if (conflictError) {
      return { success: false, error: conflictError }
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete existing exceptions
      await tx.availabilityException.deleteMany({
        where: { tutorId }
      })

      // Insert new exceptions
      // Convert date strings (YYYY-MM-DD) to Date objects representing midnight Eastern Time
      // We need to create dates that represent midnight in Eastern Time, then convert to UTC for storage
      await tx.availabilityException.createMany({
        data: exceptions.map(exception => {
          // Parse the date string (YYYY-MM-DD format)
          const [year, month, day] = exception.startDate.split('-').map(Number)
          // Create a date representing midnight in Eastern Time
          // Use a reference date in UTC, convert to Eastern, set to midnight, then back to UTC
          const referenceDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
          const easternDate = toZonedTime(referenceDate, TIMEZONE)
          const midnightEastern = set(easternDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
          const startDate = fromZonedTime(midnightEastern, TIMEZONE)
          
          // Same for endDate
          const [endYear, endMonth, endDay] = exception.endDate.split('-').map(Number)
          const endReferenceDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 12, 0, 0, 0))
          const endEasternDate = toZonedTime(endReferenceDate, TIMEZONE)
          const endMidnightEastern = set(endEasternDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
          const endDate = fromZonedTime(endMidnightEastern, TIMEZONE)
          
          return {
            tutorId: exception.tutorId,
            startDate,
            endDate,
            isUnavailable: exception.isUnavailable
          }
        })
      })
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error saving availability exceptions:', error)
    return { success: false, error: 'Erreur lors de la sauvegarde des exceptions' }
  }
}

function validateAvailabilityRules(rules: Omit<AvailabilityRule, 'id'>[]): string | null {
  // Group rules by weekday
  const rulesByWeekday = rules.reduce((acc, rule) => {
    if (!acc[rule.weekday]) {
      acc[rule.weekday] = []
    }
    acc[rule.weekday].push(rule)
    return acc
  }, {} as Record<number, Omit<AvailabilityRule, 'id'>[]>)

  // Check for overlaps within each day
  for (const [weekday, dayRules] of Object.entries(rulesByWeekday)) {
    // Sort by start time
    dayRules.sort((a, b) => a.startTime.localeCompare(b.startTime))

    for (let i = 0; i < dayRules.length - 1; i++) {
      const current = dayRules[i]
      const next = dayRules[i + 1]

      if (current.endTime > next.startTime) {
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        return `Chevauchement détecté le ${dayNames[parseInt(weekday)]}: ${current.startTime}-${current.endTime} et ${next.startTime}-${next.endTime}`
      }
    }

    // Validate time format and logic
    for (const rule of dayRules) {
      if (rule.startTime >= rule.endTime) {
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        return `Heure de fin doit être après l'heure de début le ${dayNames[parseInt(weekday)]}: ${rule.startTime}-${rule.endTime}`
      }
    }
  }

  return null
}

function validateAvailabilityExceptions(exceptions: Omit<AvailabilityException, 'id'>[]): string | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const exception of exceptions) {
    const startDate = new Date(exception.startDate)
    const endDate = new Date(exception.endDate)

    // Check if dates are in the past
    if (startDate < today) {
      return `Impossible de modifier les disponibilités pour des dates passées: ${exception.startDate}`
    }

    // Check if start date is before end date
    if (startDate > endDate) {
      return `La date de début doit être avant la date de fin: ${exception.startDate} - ${exception.endDate}`
    }
  }

  return null
}

async function checkAvailabilityConflicts(
  tutorId: string, 
  rules: Omit<AvailabilityRule, 'id'>[]
): Promise<string | null> {
  // Get future appointments for this tutor
  const futureAppointments = await prisma.appointment.findMany({
    where: {
      tutorId,
      startDatetime: {
        gte: new Date()
      },
      status: 'scheduled'
    },
    select: {
      startDatetime: true,
      endDatetime: true
    }
  })

  // Check if any appointment falls outside the new availability rules
  for (const appointment of futureAppointments) {
    const appointmentDate = new Date(appointment.startDatetime)
    const weekday = appointmentDate.getDay()
    const startTime = appointment.startDatetime.toTimeString().slice(0, 5)
    const endTime = appointment.endDatetime.toTimeString().slice(0, 5)

    // Find rules for this weekday
    const dayRules = rules.filter(rule => rule.weekday === weekday)
    
    if (dayRules.length === 0) {
      // No availability rules for this day, but there's an appointment
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      return `Vous avez un rendez-vous le ${dayNames[weekday]} ${appointmentDate.toLocaleDateString('fr-CA')} mais aucune disponibilité définie pour ce jour`
    }

    // Check if appointment falls within any rule
    const isWithinRules = dayRules.some(rule => 
      startTime >= rule.startTime && endTime <= rule.endTime
    )

    if (!isWithinRules) {
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      return `Vous avez un rendez-vous le ${dayNames[weekday]} ${appointmentDate.toLocaleDateString('fr-CA')} qui ne correspond pas à vos nouvelles disponibilités`
    }
  }

  return null
}

async function checkExceptionConflicts(
  tutorId: string,
  exceptions: Omit<AvailabilityException, 'id'>[]
): Promise<string | null> {
  // Get future appointments for this tutor
  const futureAppointments = await prisma.appointment.findMany({
    where: {
      tutorId,
      startDatetime: {
        gte: new Date()
      },
      status: 'scheduled'
    },
    select: {
      startDatetime: true,
      endDatetime: true
    }
  })

  // Check if any appointment falls within unavailable exceptions
  for (const appointment of futureAppointments) {
    const appointmentDate = new Date(appointment.startDatetime)

    for (const exception of exceptions) {
      if (exception.isUnavailable) {
        const startDate = new Date(exception.startDate)
        const endDate = new Date(exception.endDate)
        
        if (appointmentDate >= startDate && appointmentDate <= endDate) {
          return `Vous avez un rendez-vous le ${appointmentDate.toLocaleDateString('fr-CA')} mais vous avez défini cette période comme indisponible`
        }
      }
    }
  }

  return null
}