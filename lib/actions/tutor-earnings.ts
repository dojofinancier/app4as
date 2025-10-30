'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'

export interface TutorEarningsData {
  id: string
  tutorId: string
  startDatetime: Date
  durationMin: number
  hoursWorked: number | null
  rateAtTime: number | null
  tutorEarningsCad: number
  earningsStatus: string | null
  paidAt: Date | null
  tutorNote: string | null
  adminNote: string | null
  adjustedAt: Date | null
  course: {
    titleFr: string
  }
}

export interface MonthlyEarnings {
  month: string
  year: number
  hours: number
  earnings: number
  paidHours: number
  paidEarnings: number
}

export interface YearToDateData {
  totalHours: number
  totalEarnings: number
  paidHours: number
  paidEarnings: number
  averageMonthlyHours: number
  averageMonthlyEarnings: number
}

/**
 * Get tutor earnings data for a specific tutor
 */
export async function getTutorEarnings(tutorId: string): Promise<{ success: boolean; data?: TutorEarningsData[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Check if user is the tutor or admin
    if (user.id !== tutorId && user.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    const earnings = await prisma.orderItem.findMany({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        earningsStatus: {
          not: 'cancelled'
        }
      },
      include: {
        course: {
          select: {
            titleFr: true
          }
        }
      },
      orderBy: {
        startDatetime: 'desc'
      }
    })

    const formattedEarnings: TutorEarningsData[] = earnings.map(item => ({
      id: item.id,
      tutorId: item.tutorId,
      startDatetime: item.startDatetime,
      durationMin: item.durationMin,
      hoursWorked: item.hoursWorked ? Number(item.hoursWorked) : null,
      rateAtTime: item.rateAtTime ? Number(item.rateAtTime) : null,
      tutorEarningsCad: Number(item.tutorEarningsCad),
      earningsStatus: item.earningsStatus,
      paidAt: item.paidAt,
      tutorNote: item.tutorNote,
      adminNote: item.adminNote,
      adjustedAt: item.adjustedAt,
      course: {
        titleFr: item.course.titleFr
      }
    }))

    return { success: true, data: formattedEarnings }
  } catch (error) {
    console.error('Error fetching tutor earnings:', error)
    return { success: false, error: 'Erreur lors de la récupération des gains' }
  }
}

/**
 * Get monthly earnings summary for a tutor
 */
export async function getTutorMonthlyEarnings(tutorId: string): Promise<{ success: boolean; data?: MonthlyEarnings[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Non autorisé' }
    }

    if (user.id !== tutorId && user.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    const earnings = await prisma.orderItem.findMany({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        earningsStatus: {
          not: 'cancelled'
        }
      },
      select: {
        startDatetime: true,
        durationMin: true,
        hoursWorked: true,
        tutorEarningsCad: true,
        earningsStatus: true,
        paidAt: true
      },
      orderBy: {
        startDatetime: 'desc'
      }
    })

    // Group by month and year
    const monthlyData = new Map<string, MonthlyEarnings>()

    earnings.forEach(item => {
      const date = new Date(item.startDatetime)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          year: date.getFullYear(),
          hours: 0,
          earnings: 0,
          paidHours: 0,
          paidEarnings: 0
        })
      }

      const data = monthlyData.get(monthKey)!
      const hours = item.hoursWorked ? Number(item.hoursWorked) : (item.durationMin / 60)
      const earnings = Number(item.tutorEarningsCad)

      data.hours += hours
      data.earnings += earnings

      if (item.earningsStatus === 'paid') {
        data.paidHours += hours
        data.paidEarnings += earnings
      }
    })

    const result = Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month))
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching monthly earnings:', error)
    return { success: false, error: 'Erreur lors de la récupération des gains mensuels' }
  }
}

/**
 * Get year-to-date earnings for a tutor
 */
export async function getTutorYearToDateEarnings(tutorId: string): Promise<{ success: boolean; data?: YearToDateData; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Non autorisé' }
    }

    if (user.id !== tutorId && user.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59)

    const earnings = await prisma.orderItem.findMany({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        startDatetime: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        startDatetime: true,
        durationMin: true,
        hoursWorked: true,
        tutorEarningsCad: true,
        earningsStatus: true
      }
    })

    let totalHours = 0
    let totalEarnings = 0
    let paidHours = 0
    let paidEarnings = 0

    earnings.forEach(item => {
      const hours = item.hoursWorked ? Number(item.hoursWorked) : (item.durationMin / 60)
      const earnings = Number(item.tutorEarningsCad)

      totalHours += hours
      totalEarnings += earnings

      if (item.earningsStatus === 'paid') {
        paidHours += hours
        paidEarnings += earnings
      }
    })

    const currentMonth = new Date().getMonth() + 1
    const averageMonthlyHours = totalHours / currentMonth
    const averageMonthlyEarnings = totalEarnings / currentMonth

    const result: YearToDateData = {
      totalHours,
      totalEarnings,
      paidHours,
      paidEarnings,
      averageMonthlyHours,
      averageMonthlyEarnings
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching year-to-date earnings:', error)
    return { success: false, error: 'Erreur lors de la récupération des gains annuels' }
  }
}

/**
 * Add or update tutor note for an appointment
 */
export async function updateTutorNote(orderItemId: string, tutorNote: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Validate note length
    if (tutorNote.length > 500) {
      return { success: false, error: 'La note ne peut pas dépasser 500 caractères' }
    }

    // Check if user is the tutor for this order item
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: { tutorId: true }
    })

    if (!orderItem) {
      return { success: false, error: 'Rendez-vous non trouvé' }
    }

    if (user.id !== orderItem.tutorId && user.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { tutorNote }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error updating tutor note:', error)
    return { success: false, error: 'Erreur lors de la mise à jour de la note' }
  }
}

/**
 * Admin: Adjust tutor earnings for an appointment
 */
export async function adjustTutorEarnings(
  orderItemId: string,
  hoursWorked: number,
  adminNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    // Validate hours worked
    if (hoursWorked <= 0) {
      return { success: false, error: 'Les heures travaillées doivent être positives' }
    }

    // Get the order item with tutor rate
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: {
        tutorId: true,
        rateAtTime: true,
        tutor: {
          select: {
            hourlyBaseRateCad: true
          }
        }
      }
    })

    if (!orderItem) {
      return { success: false, error: 'Rendez-vous non trouvé' }
    }

    // Use rate at time if available, otherwise use current tutor rate
    const rate = orderItem.rateAtTime ? Number(orderItem.rateAtTime) : Number(orderItem.tutor.hourlyBaseRateCad)
    const newEarnings = hoursWorked * rate

    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        hoursWorked,
        tutorEarningsCad: newEarnings,
        adminNote,
        adjustedAt: new Date(),
        adjustedBy: user.id
      }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error adjusting tutor earnings:', error)
    return { success: false, error: 'Erreur lors de l\'ajustement des gains' }
  }
}

/**
 * Admin: Mark earnings as paid
 */
export async function markEarningsAsPaid(
  orderItemId: string,
  paidAt: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    // Validate paid date
    if (paidAt > new Date()) {
      return { success: false, error: 'La date de paiement ne peut pas être dans le futur' }
    }

    // Get the order item to check appointment date
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: { startDatetime: true }
    })

    if (!orderItem) {
      return { success: false, error: 'Rendez-vous non trouvé' }
    }

    if (paidAt < orderItem.startDatetime) {
      return { success: false, error: 'La date de paiement ne peut pas être antérieure à la date du rendez-vous' }
    }

    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        earningsStatus: 'paid',
        paidAt
      }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error marking earnings as paid:', error)
    return { success: false, error: 'Erreur lors du marquage du paiement' }
  }
}

/**
 * Get tutor's own unpaid appointments (tutor can only view their own)
 */
export async function getTutorOwnUnpaidAppointments(tutorId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Verify user is the tutor themselves
    if (user.id !== tutorId) {
      return { success: false, error: 'Non autorisé' }
    }

    // Get all completed but unpaid appointments
    const unpaidItems = await prisma.orderItem.findMany({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        earningsStatus: 'earned',
      },
      include: {
        course: {
          select: {
            titleFr: true,
          }
        },
        appointment: {
          select: {
            id: true,
            startDatetime: true,
            endDatetime: true,
          }
        }
      },
      orderBy: {
        startDatetime: 'desc',
      },
    })

    // Group by month (YYYY-MM format)
    const monthGroups = new Map<string, {
      month: string,
      monthName: string,
      appointments: Array<{
        id: string,
        orderItemId: string,
        startDatetime: Date,
        endDatetime: Date,
        course: { titleFr: string },
        hoursWorked: number | null,
        tutorEarningsCad: number,
        rateAtTime: number | null
      }>,
      totalHours: number,
      totalAmount: number
    }>()

    unpaidItems.forEach(item => {
      if (!item.appointment) return

      const date = new Date(item.startDatetime)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ]
      const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`

      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, {
          month: monthKey,
          monthName,
          appointments: [],
          totalHours: 0,
          totalAmount: 0,
        })
      }

      const group = monthGroups.get(monthKey)!
      const hours = item.hoursWorked ? Number(item.hoursWorked) : (item.durationMin / 60)
      const earnings = Number(item.tutorEarningsCad)

      group.appointments.push({
        id: item.appointment.id,
        orderItemId: item.id,
        startDatetime: item.startDatetime,
        endDatetime: item.endDatetime,
        course: item.course,
        hoursWorked: item.hoursWorked ? Number(item.hoursWorked) : null,
        tutorEarningsCad: earnings,
        rateAtTime: item.rateAtTime ? Number(item.rateAtTime) : null,
      })

      group.totalHours += hours
      group.totalAmount += earnings
    })

    const result = Array.from(monthGroups.values()).sort((a, b) => b.month.localeCompare(a.month))
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching unpaid appointments:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get tutor's own payment history (tutor can only view their own)
 */
export async function getTutorOwnPaymentHistory(tutorId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Verify user is the tutor themselves
    if (user.id !== tutorId) {
      return { success: false, error: 'Non autorisé' }
    }

    // Get all paid appointments
    const paidItems = await prisma.orderItem.findMany({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        earningsStatus: 'paid',
        paidAt: {
          not: null,
        },
      },
      include: {
        course: {
          select: {
            titleFr: true,
          }
        },
        appointment: {
          select: {
            id: true,
            startDatetime: true,
            endDatetime: true,
          }
        }
      },
      orderBy: {
        paidAt: 'desc',
      },
    })

    // Group by payment month (YYYY-MM format)
    const paymentGroups = new Map<string, {
      paymentMonth: string,
      monthName: string,
      paidAt: Date,
      appointments: Array<{
        id: string,
        orderItemId: string,
        startDatetime: Date,
        endDatetime: Date,
        course: { titleFr: string },
        hoursWorked: number | null,
        tutorEarningsCad: number,
        paidAt: Date
      }>,
      totalHours: number,
      totalAmount: number
    }>()

    paidItems.forEach(item => {
      if (!item.paidAt || !item.appointment) return

      const paidDate = new Date(item.paidAt)
      const monthKey = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`
      
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ]
      const monthName = `${monthNames[paidDate.getMonth()]} ${paidDate.getFullYear()}`

      if (!paymentGroups.has(monthKey)) {
        paymentGroups.set(monthKey, {
          paymentMonth: monthKey,
          monthName,
          paidAt: paidDate,
          appointments: [],
          totalHours: 0,
          totalAmount: 0,
        })
      }

      const group = paymentGroups.get(monthKey)!
      const hours = item.hoursWorked ? Number(item.hoursWorked) : (item.durationMin / 60)
      const earnings = Number(item.tutorEarningsCad)

      group.appointments.push({
        id: item.appointment.id,
        orderItemId: item.id,
        startDatetime: item.startDatetime,
        endDatetime: item.endDatetime,
        course: item.course,
        hoursWorked: item.hoursWorked ? Number(item.hoursWorked) : null,
        tutorEarningsCad: earnings,
        paidAt: paidDate,
      })

      group.totalHours += hours
      group.totalAmount += earnings
      
      if (paidDate > group.paidAt) {
        group.paidAt = paidDate
      }
    })

    const result = Array.from(paymentGroups.values()).sort((a, b) => b.paymentMonth.localeCompare(a.paymentMonth))
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get all tutor earnings for admin management
 */
export async function getAllTutorEarnings(): Promise<{ success: boolean; data?: TutorEarningsData[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    const earnings = await prisma.orderItem.findMany({
      where: {
        appointment: {
          status: 'completed'
        }
      },
      include: {
        course: {
          select: {
            titleFr: true
          }
        },
        tutor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        startDatetime: 'desc'
      }
    })

    const formattedEarnings: TutorEarningsData[] = earnings.map(item => ({
      id: item.id,
      tutorId: item.tutorId,
      startDatetime: item.startDatetime,
      durationMin: item.durationMin,
      hoursWorked: item.hoursWorked ? Number(item.hoursWorked) : null,
      rateAtTime: item.rateAtTime ? Number(item.rateAtTime) : null,
      tutorEarningsCad: Number(item.tutorEarningsCad),
      earningsStatus: item.earningsStatus,
      paidAt: item.paidAt,
      tutorNote: item.tutorNote,
      adminNote: item.adminNote,
      adjustedAt: item.adjustedAt,
      course: {
        titleFr: item.course.titleFr
      }
    }))

    return { success: true, data: formattedEarnings }
  } catch (error) {
    console.error('Error fetching all tutor earnings:', error)
    return { success: false, error: 'Erreur lors de la récupération des gains' }
  }
}
