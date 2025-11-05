'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSignupWebhook, sendTicketStatusChangedWebhook, sendTicketMessageWebhook, sendBookingCancelledWebhook, sendAppointmentCompletedWebhook } from '@/lib/webhooks/make'
import { autoCompletePastAppointments } from './appointments'

/**
 * Create a new tutor account (admin only)
 */
export async function createTutorAccount(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  displayName: string
  bioFr: string
  hourlyBaseRateCad: number
  priority?: number
  courseIds: string[]
  availabilityRules: Array<{
    weekday: number
    startTime: string
    endTime: string
  }>
}) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    // Step 1: Create user in Supabase Auth using admin client
    const adminClient = createAdminClient()
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'tutor'
      }
    })

    if (authError) {
      console.error('Supabase Auth error:', authError)
      return { success: false, error: `Erreur d'authentification: ${authError.message}` }
    }

    if (!authData.user) {
      return { success: false, error: 'Échec de la création du compte' }
    }

    // Step 2: Create user in database
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'tutor',
      },
    })

    // Step 3: Create tutor profile
    const tutor = await prisma.tutor.create({
      data: {
        id: user.id,
        displayName: data.displayName,
        bioFr: data.bioFr,
        hourlyBaseRateCad: data.hourlyBaseRateCad,
        priority: data.priority || 100,
        active: true,
      },
    })

    // Step 4: Create availability rules
    const availabilityRules = []
    for (const rule of data.availabilityRules) {
      const availabilityRule = await prisma.availabilityRule.create({
        data: {
          tutorId: user.id,
          weekday: rule.weekday,
          startTime: rule.startTime,
          endTime: rule.endTime,
        },
      })
      availabilityRules.push(availabilityRule)
    }

    // Step 5: Assign tutor to courses
    const tutorCourses = []
    for (const courseId of data.courseIds) {
      const tutorCourse = await prisma.tutorCourse.create({
        data: {
          tutorId: user.id,
          courseId: courseId,
          active: true,
        },
      })
      tutorCourses.push(tutorCourse)
    }

    // Step 6: Send signup webhook
    await sendSignupWebhook({
      userId: user.id,
      role: user.role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    })

    revalidatePath('/admin/tuteurs')
    return { 
      success: true, 
      message: 'Tuteur créé avec succès. Le tuteur peut maintenant se connecter avec ses identifiants.',
      data: {
        user,
        tutor,
        availabilityRules,
        tutorCourses,
      }
    }
  } catch (error) {
    console.error('Error creating tutor account:', error)
    return { success: false, error: 'Une erreur est survenue lors de la création du tuteur' }
  }
}

/**
 * Get all tutors for admin management
 */
export async function getAllTutors() {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const tutors = await prisma.tutor.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        tutorCourses: {
          include: {
            course: {
              select: {
                id: true,
                titleFr: true,
                slug: true,
              },
            },
          },
        },
        availabilityRules: {
          orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: { priority: 'asc' },
    })

    // Convert Decimal fields to numbers for serialization
    const tutorsWithNumbers = tutors.map(tutor => ({
      ...tutor,
      hourlyBaseRateCad: Number(tutor.hourlyBaseRateCad),
    }))

    return { success: true, data: tutorsWithNumbers }
  } catch (error) {
    console.error('Error fetching tutors:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Update tutor profile (admin only)
 */
export async function updateTutorProfile(
  tutorId: string,
  data: {
    displayName?: string
    bioFr?: string
    hourlyBaseRateCad?: number
    priority?: number
    active?: boolean
  }
) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const updatedTutor = await prisma.tutor.update({
      where: { id: tutorId },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.bioFr && { bioFr: data.bioFr }),
        ...(data.hourlyBaseRateCad && { hourlyBaseRateCad: data.hourlyBaseRateCad }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.active !== undefined && { active: data.active }),
      },
    })

    revalidatePath('/admin/tuteurs')
    return { success: true, data: updatedTutor }
  } catch (error) {
    console.error('Error updating tutor profile:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Deactivate tutor account (admin only)
 */
export async function deactivateTutor(tutorId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    // Deactivate tutor profile
    await prisma.tutor.update({
      where: { id: tutorId },
      data: { active: false },
    })

    // Deactivate all tutor-course assignments
    await prisma.tutorCourse.updateMany({
      where: { tutorId },
      data: { active: false },
    })

    revalidatePath('/admin/tuteurs')
    return { success: true }
  } catch (error) {
    console.error('Error deactivating tutor:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get tutor utilization (last 3 months)
 */
export async function getTutorUtilization(tutorId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    // Get availability rules for the tutor
    const availabilityRules = await prisma.availabilityRule.findMany({
      where: { tutorId },
    })

    // Get appointments in the last 3 months
    const appointments = await prisma.appointment.findMany({
      where: {
        tutorId,
        startDatetime: {
          gte: threeMonthsAgo,
        },
        status: {
          in: ['scheduled', 'completed'],
        },
      },
      select: {
        startDatetime: true,
        endDatetime: true,
      },
    })

    // Calculate total available slots (simplified - using 30-min slots)
    let totalAvailableSlots = 0
    const currentDate = new Date(threeMonthsAgo)
    const endDate = new Date()

    while (currentDate <= endDate) {
      const weekday = currentDate.getDay()
      const dayRules = availabilityRules.filter(rule => rule.weekday === weekday)
      
      for (const rule of dayRules) {
        const startTime = rule.startTime.split(':').map(Number)
        const endTime = rule.endTime.split(':').map(Number)
        const startMinutes = startTime[0] * 60 + startTime[1]
        const endMinutes = endTime[0] * 60 + endTime[1]
        
        // Count 30-minute slots
        totalAvailableSlots += Math.floor((endMinutes - startMinutes) / 30)
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Calculate booked slots (convert appointments to 30-min slots)
    const bookedSlots = appointments.reduce((total, apt) => {
      const durationMinutes = (apt.endDatetime.getTime() - apt.startDatetime.getTime()) / (1000 * 60)
      return total + Math.ceil(durationMinutes / 30)
    }, 0)

    const utilization = totalAvailableSlots > 0 ? (bookedSlots / totalAvailableSlots) * 100 : 0

    return { 
      success: true, 
      data: {
        utilization: Math.round(utilization * 100) / 100,
        totalAvailableSlots,
        bookedSlots,
        period: '3 months'
      }
    }
  } catch (error) {
    console.error('Error calculating tutor utilization:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get tutor earnings summary
 */
export async function getTutorEarningsSummary(tutorId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Get current month date range
    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
    
    // Get year start
    const yearStart = new Date(currentYear, 0, 1)
    
    // Get current month - filter by appointment completion date (startDatetime)
    // Separate earned (completed but not paid) vs paid
    const currentMonthEarned = await prisma.orderItem.aggregate({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        startDatetime: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
        earningsStatus: 'earned',
      },
      _sum: {
        tutorEarningsCad: true,
        hoursWorked: true,
      },
      _count: {
        id: true,
      },
    })

    const currentMonthPaid = await prisma.orderItem.aggregate({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        startDatetime: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
        earningsStatus: 'paid',
      },
      _sum: {
        tutorEarningsCad: true,
        hoursWorked: true,
      },
    })

    // Get year-to-date - all completed appointments
    const yearToDateEarned = await prisma.orderItem.aggregate({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        startDatetime: {
          gte: yearStart,
        },
        earningsStatus: 'earned',
      },
      _sum: {
        tutorEarningsCad: true,
        hoursWorked: true,
      },
    })

    const yearToDatePaid = await prisma.orderItem.aggregate({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        startDatetime: {
          gte: yearStart,
        },
        earningsStatus: 'paid',
      },
      _sum: {
        tutorEarningsCad: true,
        hoursWorked: true,
      },
    })

    // Get appointments count for current month
    const currentMonthAppointmentsCount = await prisma.orderItem.count({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        startDatetime: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    })

    const currentMonthTotalEarnings = Number(currentMonthEarned._sum.tutorEarningsCad || 0) + Number(currentMonthPaid._sum.tutorEarningsCad || 0)
    const yearToDateTotalEarnings = Number(yearToDateEarned._sum.tutorEarningsCad || 0) + Number(yearToDatePaid._sum.tutorEarningsCad || 0)

    return {
      success: true,
      data: {
        currentMonth: {
          earned: Number(currentMonthEarned._sum.tutorEarningsCad || 0),
          paid: Number(currentMonthPaid._sum.tutorEarningsCad || 0),
          totalEarnings: currentMonthTotalEarnings,
          totalHours: Number(currentMonthEarned._sum.hoursWorked || 0) + Number(currentMonthPaid._sum.hoursWorked || 0),
          appointmentsCount: currentMonthAppointmentsCount,
        },
        yearToDate: {
          earned: Number(yearToDateEarned._sum.tutorEarningsCad || 0),
          paid: Number(yearToDatePaid._sum.tutorEarningsCad || 0),
          totalEarnings: yearToDateTotalEarnings,
          totalHours: Number(yearToDateEarned._sum.hoursWorked || 0) + Number(yearToDatePaid._sum.hoursWorked || 0),
        },
      }
    }
  } catch (error) {
    console.error('Error calculating tutor earnings:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get tutor availability for admin viewing (admin only)
 */
export async function getTutorAvailabilityForAdmin(tutorId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
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

/**
 * Get tutor unpaid appointments grouped by month (admin only)
 */
export async function getTutorUnpaidAppointments(tutorId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
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
      // Skip if no appointment associated
      if (!item.appointment) {
        return
      }

      const date = new Date(item.startDatetime)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      // Format month name in French
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

    // Convert to array and sort by month (newest first)
    const result = Array.from(monthGroups.values()).sort((a, b) => b.month.localeCompare(a.month))

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching unpaid appointments:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get tutor payment history grouped by payment month (admin only)
 */
export async function getTutorPaymentHistory(tutorId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
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
      
      // Format month name in French
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ]
      const monthName = `${monthNames[paidDate.getMonth()]} ${paidDate.getFullYear()}`

      if (!paymentGroups.has(monthKey)) {
        // Use the most recent paidAt date for this month as the representative date
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
      
      // Update paidAt to most recent date in the month
      if (paidDate > group.paidAt) {
        group.paidAt = paidDate
      }
    })

    // Convert to array and sort by payment month (newest first)
    const result = Array.from(paymentGroups.values()).sort((a, b) => b.paymentMonth.localeCompare(a.paymentMonth))

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Mark appointments as paid (admin only)
 */
export async function markAppointmentsAsPaid(
  orderItemIds: string[],
  paidAt: Date,
  adminNote?: string
) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    // Validate paidAt is not in future
    if (paidAt > new Date()) {
      return { success: false, error: 'La date de paiement ne peut pas être dans le futur' }
    }

    // Validate all order items exist and belong to same tutor
    const orderItems = await prisma.orderItem.findMany({
      where: {
        id: { in: orderItemIds },
      },
      include: {
        appointment: {
          select: {
            status: true,
            startDatetime: true,
          }
        }
      },
    })

    if (orderItems.length !== orderItemIds.length) {
      return { success: false, error: 'Un ou plusieurs rendez-vous introuvables' }
    }

    // Check all belong to same tutor
    const tutorIds = new Set(orderItems.map(item => item.tutorId))
    if (tutorIds.size > 1) {
      return { success: false, error: 'Les rendez-vous doivent appartenir au même tuteur' }
    }

    // Validate all appointments are completed
    const incompleteAppointments = orderItems.filter(
      item => !item.appointment || item.appointment.status !== 'completed'
    )
    if (incompleteAppointments.length > 0) {
      return { success: false, error: 'Tous les rendez-vous doivent être complétés' }
    }

    // Validate all have earningsStatus = 'earned' (not cancelled, not paid, not scheduled)
    const alreadyPaid = orderItems.filter(
      item => item.earningsStatus !== 'earned'
    )
    if (alreadyPaid.length > 0) {
      return { success: false, error: 'Certains rendez-vous ne peuvent pas être marqués comme payés (déjà payés ou annulés)' }
    }

    // Validate paidAt is not before appointment dates
    const invalidDates = orderItems.filter(
      item => paidAt < item.startDatetime
    )
    if (invalidDates.length > 0) {
      return { success: false, error: 'La date de paiement ne peut pas être antérieure aux dates des rendez-vous' }
    }

    // Update all order items atomically
    await prisma.orderItem.updateMany({
      where: {
        id: { in: orderItemIds },
      },
      data: {
        earningsStatus: 'paid',
        paidAt,
        adminNote: adminNote || null,
        adjustedBy: currentUser.id,
        adjustedAt: new Date(),
      },
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error marking appointments as paid:', error)
    return { success: false, error: 'Une erreur est survenue lors du marquage des paiements' }
  }
}

/**
 * Get tutor appointments count for current month (admin only)
 */
export async function getTutorAppointmentsCountThisMonth(tutorId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

    const count = await prisma.orderItem.count({
      where: {
        tutorId,
        appointment: {
          status: 'completed'
        },
        startDatetime: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    })

    return { success: true, data: count }
  } catch (error) {
    console.error('Error counting appointments:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get all students with pagination and sorting (admin only)
 */
export async function getAllStudents(params: {
  cursor?: string
  limit?: number
  sortBy?: 'name' | 'createdAt' | 'totalSpent'
  sortOrder?: 'asc' | 'desc'
  search?: string
}) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const limit = params.limit || 20
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'desc'
    const search = params.search?.toLowerCase() || ''

    // Build where clause for search
    const searchWhere = search ? {
      AND: [
        { role: 'student' as const },
        {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      ]
    } : { role: 'student' as const }

    // Build cursor condition - always use createdAt for cursor-based pagination
    const cursorWhere = params.cursor ? {
      createdAt: sortOrder === 'desc' ? { lt: new Date(params.cursor) } : { gt: new Date(params.cursor) }
    } : {}

    // Get students with total spent calculation
    const students = await prisma.user.findMany({
      where: {
        ...searchWhere,
        ...cursorWhere
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          select: {
            totalCad: true,
            status: true
          }
        },
        refundRequests: {
          select: {
            amount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }, // Always sort by createdAt for consistent pagination
      take: limit + 1 // Take one extra to check if there are more
    })

    // Calculate total spent for each student
    const studentsWithTotals = students.map(student => {
      const totalSpent = student.orders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + Number(order.totalCad), 0)
      
      const totalRefunded = student.refundRequests
        .filter(refund => refund.status === 'approved')
        .reduce((sum, refund) => sum + Number(refund.amount), 0)

      return {
        ...student,
        totalSpent,
        totalRefunded,
        netSpent: totalSpent - totalRefunded
      }
    })

    // Apply sorting based on the requested sort field
    if (sortBy === 'name') {
      studentsWithTotals.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
        return sortOrder === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB)
      })
    } else if (sortBy === 'totalSpent') {
      studentsWithTotals.sort((a, b) => 
        sortOrder === 'desc' ? b.netSpent - a.netSpent : a.netSpent - b.netSpent
      )
    }
    // For 'createdAt', we already sorted in the query, so no additional sorting needed

    const hasMore = studentsWithTotals.length > limit
    const nextCursor = hasMore ? studentsWithTotals[limit - 1].createdAt.toISOString() : null

    return {
      success: true,
      data: {
        students: studentsWithTotals.slice(0, limit),
        hasMore,
        nextCursor
      }
    }
  } catch (error) {
    console.error('Error fetching students:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get detailed student information (admin only)
 */
export async function getStudentDetails(studentId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'student' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            totalCad: true,
            status: true,
            createdAt: true,
          }
        },
        refundRequests: {
          select: {
            amount: true,
            status: true,
            reason: true
          }
        },
        appointments: {
          select: {
            id: true,
            startDatetime: true,
            endDatetime: true,
            status: true,
            cancellationReason: true,
            cancelledBy: true,
            cancelledAt: true,
            course: {
              select: {
                titleFr: true
              }
            },
            tutor: {
              select: {
                displayName: true
              }
            }
          }
        },
        _count: {
          select: {
            sentMessages: true,
            receivedMessages: true
          }
        }
      }
    })

    if (!student) {
      return { success: false, error: 'Étudiant non trouvé' }
    }

    // Calculate financial breakdown
    const paidOrders = student.orders.filter(order => order.status === 'paid')
    const totalSpent = paidOrders.reduce((sum, order) => sum + Number(order.totalCad), 0)
    
    const totalRefunded = student.refundRequests
      .filter(refund => refund.status === 'approved')
      .reduce((sum, refund) => sum + Number(refund.amount), 0)

    const totalCouponDiscount = 0 // Coupon discount calculation removed - not available in current schema

    // Count appointments by status
    const appointmentCounts = {
      upcoming: student.appointments.filter(apt => 
        apt.status === 'scheduled' && new Date(apt.startDatetime) > new Date()
      ).length,
      past: student.appointments.filter(apt => 
        apt.status === 'completed' || (apt.status === 'scheduled' && new Date(apt.startDatetime) <= new Date())
      ).length,
      cancelled: student.appointments.filter(apt => apt.status === 'cancelled').length,
      total: student.appointments.length
    }

    return {
      success: true,
      data: {
        ...student,
        financialBreakdown: {
          totalSpent,
          totalRefunded,
          totalCouponDiscount,
          netSpent: totalSpent - totalRefunded
        },
        appointmentCounts,
        messageCount: student._count.sentMessages + student._count.receivedMessages
      }
    }
  } catch (error) {
    console.error('Error fetching student details:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get student appointments with filters (admin only)
 */
export async function getStudentAppointments(studentId: string, params: {
  filter?: 'upcoming' | 'past' | 'cancelled' | 'all'
  cursor?: string
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const limit = params.limit || 20
    const filter = params.filter || 'all'
    const now = new Date()

    // Build where clause based on filter
    let whereClause: any = { userId: studentId }

    switch (filter) {
      case 'upcoming':
        whereClause = {
          ...whereClause,
          status: 'scheduled',
          startDatetime: { gt: now }
        }
        break
      case 'past':
        whereClause = {
          ...whereClause,
          OR: [
            { status: 'completed' },
            { 
              status: 'scheduled',
              startDatetime: { lte: now }
            }
          ]
        }
        break
      case 'cancelled':
        whereClause = {
          ...whereClause,
          status: 'cancelled'
        }
        break
      // 'all' - no additional filters
    }

    // Add cursor condition
    if (params.cursor) {
      whereClause.startDatetime = {
        ...whereClause.startDatetime,
        lt: new Date(params.cursor)
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        startDatetime: true,
        endDatetime: true,
        status: true,
        cancellationReason: true,
        cancelledBy: true,
        cancelledAt: true,
        course: {
          select: {
            titleFr: true
          }
        },
        tutor: {
          select: {
            displayName: true
          }
        }
      },
      orderBy: { startDatetime: 'desc' },
      take: limit + 1
    })

    const hasMore = appointments.length > limit
    const nextCursor = hasMore ? appointments[limit - 1].startDatetime.toISOString() : null

    return {
      success: true,
      data: {
        appointments: appointments.slice(0, limit),
        hasMore,
        nextCursor
      }
    }
  } catch (error) {
    console.error('Error fetching student appointments:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get student orders with refund info (admin only)
 */
export async function getStudentOrders(studentId: string, params: {
  cursor?: string
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const limit = params.limit || 20

    // Build where clause
    let whereClause: any = { userId: studentId }

    // Add cursor condition
    if (params.cursor) {
      whereClause.createdAt = { lt: new Date(params.cursor) }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        totalCad: true,
        status: true,
        createdAt: true,
        stripePaymentIntentId: true,
        items: {
          select: {
            course: {
              select: {
                titleFr: true
              }
            },
            tutor: {
              select: {
                displayName: true
              }
            },
            startDatetime: true,
            durationMin: true,
            lineTotalCad: true,
            appointment: {
              select: {
                refundRequests: {
                  select: {
                    id: true,
                    amount: true,
                    status: true,
                    reason: true,
                    processedAt: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1
    })

    const hasMore = orders.length > limit
    const nextCursor = hasMore ? orders[limit - 1].createdAt.toISOString() : null

    return {
      success: true,
      data: {
        orders: orders.slice(0, limit),
        hasMore,
        nextCursor
      }
    }
  } catch (error) {
    console.error('Error fetching student orders:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get student messages (admin only)
 */
export async function getStudentMessages(studentId: string, params: {
  cursor?: string
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  try {
    const limit = params.limit || 20

    // Build where clause - get all messages where student is sender or receiver
    let whereClause: any = {
      OR: [
        { senderId: studentId },
        { receiverId: studentId }
      ]
    }

    // Add cursor condition
    if (params.cursor) {
      whereClause.createdAt = { lt: new Date(params.cursor) }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        appointment: {
          select: {
            id: true,
            startDatetime: true,
            course: {
              select: {
                titleFr: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1
    })

    const hasMore = messages.length > limit
    const nextCursor = hasMore && messages[limit - 1].createdAt ? messages[limit - 1].createdAt!.toISOString() : null

    return {
      success: true,
      data: {
        messages: messages.slice(0, limit),
        hasMore,
        nextCursor
      }
    }
  } catch (error) {
    console.error('Error fetching student messages:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// ============================================================================
// COUPON MANAGEMENT
// ============================================================================

/**
 * Get all coupons with pagination and search
 */
export async function getAllCoupons(params: {
  search?: string
  sortBy?: 'code' | 'createdAt' | 'redemptionCount' | 'totalDiscount'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const {
      search = '',
      sortBy = 'code',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = params

    const skip = (page - 1) * limit

    // Build search condition
    const searchWhere = search ? {
      OR: [
        { code: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}

    // Build sort order
    const orderBy: any = {}
    if (sortBy === 'code') {
      orderBy.code = sortOrder
    } else if (sortBy === 'redemptionCount') {
      orderBy.redemptionCount = sortOrder
    } else if (sortBy === 'totalDiscount') {
      // We'll calculate this in memory since it requires aggregation
      // Use id as fallback for consistent ordering
      orderBy.id = 'desc'
    } else {
      // Default to code if sortBy is invalid or 'createdAt'
      orderBy.code = sortOrder
    }

    const coupons = await prisma.coupon.findMany({
      where: searchWhere,
      orderBy,
      skip,
      take: limit + 1, // Take one extra to check if there are more
      include: {
        _count: {
          select: {
            carts: true
          }
        }
      }
    })

    const hasMore = coupons.length > limit
    const couponsToReturn = hasMore ? coupons.slice(0, limit) : coupons

    // Calculate analytics for each coupon
    const couponsWithAnalytics = await Promise.all(
      couponsToReturn.map(async (coupon) => {
        // Get number of times this coupon was used
        const cartsWithCoupon = await prisma.cart.count({
          where: {
            couponId: coupon.id
          }
        })

        // For now, we'll set totalDiscount to 0 since we can't easily calculate it
        // This could be improved by adding a discount tracking field to the schema
        const totalDiscount = 0

        return {
          ...coupon,
          totalDiscount,
          orderCount: cartsWithCoupon
        }
      })
    )

    // Apply totalDiscount sorting if needed
    if (sortBy === 'totalDiscount') {
      couponsWithAnalytics.sort((a, b) => 
        sortOrder === 'desc' ? b.totalDiscount - a.totalDiscount : a.totalDiscount - b.totalDiscount
      )
    }

    return {
      success: true,
      data: {
        coupons: couponsWithAnalytics,
        hasMore,
        nextPage: hasMore ? page + 1 : null
      }
    }
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get coupon details by ID
 */
export async function getCouponDetails(couponId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        _count: {
          select: {
            carts: true
          }
        }
      }
    })

    if (!coupon) {
      return { success: false, error: 'Coupon non trouvé' }
    }

    // Get usage information for this coupon
    const cartsWithCoupon = await prisma.cart.findMany({
      where: {
        couponId: coupon.id
      },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Recent carts only
    })

    // For now, we'll set totalDiscount to 0 since we can't easily calculate it
    const totalDiscount = 0

    return {
      success: true,
      data: {
        ...coupon,
        totalDiscount,
        orderCount: cartsWithCoupon.length,
        recentOrders: cartsWithCoupon
      }
    }
  } catch (error) {
    console.error('Error fetching coupon details:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Create a new coupon
 */
export async function createCoupon(data: {
  code: string
  type: 'percent' | 'fixed'
  value: number
  startsAt?: Date
  endsAt?: Date
  maxRedemptions?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() }
    })

    if (existingCoupon) {
      return { success: false, error: 'Ce code promo existe déjà' }
    }

    // Validate coupon data
    if (data.value <= 0) {
      return { success: false, error: 'La valeur du coupon doit être positive' }
    }

    if (data.type === 'percent' && data.value > 100) {
      return { success: false, error: 'Le pourcentage ne peut pas dépasser 100%' }
    }

    if (data.startsAt && data.endsAt && data.startsAt >= data.endsAt) {
      return { success: false, error: 'La date de début doit être antérieure à la date de fin' }
    }

    if (data.maxRedemptions && data.maxRedemptions <= 0) {
      return { success: false, error: 'Le nombre maximum de redemptions doit être positif' }
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        maxRedemptions: data.maxRedemptions,
        active: true
      }
    })

    revalidatePath('/admin')
    return { success: true, data: coupon }
  } catch (error) {
    console.error('Error creating coupon:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Update a coupon
 */
export async function updateCoupon(couponId: string, data: {
  code?: string
  type?: 'percent' | 'fixed'
  value?: number
  startsAt?: Date | null
  endsAt?: Date | null
  maxRedemptions?: number | null
  active?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    })

    if (!existingCoupon) {
      return { success: false, error: 'Coupon non trouvé' }
    }

    // If updating code, check if new code already exists
    if (data.code && data.code !== existingCoupon.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: data.code.toUpperCase() }
      })

      if (codeExists) {
        return { success: false, error: 'Ce code promo existe déjà' }
      }
    }

    // Validate data
    if (data.value !== undefined && data.value <= 0) {
      return { success: false, error: 'La valeur du coupon doit être positive' }
    }

    if (data.type === 'percent' && data.value && data.value > 100) {
      return { success: false, error: 'Le pourcentage ne peut pas dépasser 100%' }
    }

    if (data.startsAt && data.endsAt && data.startsAt >= data.endsAt) {
      return { success: false, error: 'La date de début doit être antérieure à la date de fin' }
    }

    if (data.maxRedemptions !== undefined && data.maxRedemptions !== null && data.maxRedemptions <= 0) {
      return { success: false, error: 'Le nombre maximum de redemptions doit être positif' }
    }

    const updateData: any = { ...data }
    if (data.code) {
      updateData.code = data.code.toUpperCase()
    }

    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData
    })

    revalidatePath('/admin')
    return { success: true, data: coupon }
  } catch (error) {
    console.error('Error updating coupon:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(couponId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    })

    if (!existingCoupon) {
      return { success: false, error: 'Coupon non trouvé' }
    }

    // Check if coupon has been used
    const cartsWithCoupon = await prisma.cart.count({
      where: {
        couponId: couponId
      }
    })

    if (cartsWithCoupon > 0) {
      // Soft delete - deactivate instead of deleting
      const coupon = await prisma.coupon.update({
        where: { id: couponId },
        data: { active: false }
      })

      revalidatePath('/admin')
      return { success: true, data: coupon, message: 'Coupon désactivé (il a été utilisé dans des commandes)' }
    } else {
      // Hard delete - safe to delete
      await prisma.coupon.delete({
        where: { id: couponId }
      })

      revalidatePath('/admin')
      return { success: true, message: 'Coupon supprimé' }
    }
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Toggle coupon active status
 */
export async function toggleCouponStatus(couponId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    })

    if (!coupon) {
      return { success: false, error: 'Coupon non trouvé' }
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: { active: !coupon.active }
    })

    revalidatePath('/admin')
    return { success: true, data: updatedCoupon }
  } catch (error) {
    console.error('Error toggling coupon status:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// ============================================================================
// APPOINTMENT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all appointments with filters (admin only)
 */
export async function getAllAppointments(params: {
  status?: 'scheduled' | 'cancelled' | 'completed' | 'refunded' | 'all'
  startDate?: string
  endDate?: string
  tutorId?: string
  studentId?: string
  courseId?: string
  search?: string
  cursor?: string
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // Auto-complete past appointments first
    await autoCompletePastAppointments()

    const {
      status = 'all',
      startDate,
      endDate,
      tutorId,
      studentId,
      courseId,
      search = '',
      cursor,
      limit = 20
    } = params

    // Build where clause
    const whereClause: any = {}

    // Status filter
    if (status !== 'all') {
      whereClause.status = status
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.startDatetime = {}
      if (startDate) {
        whereClause.startDatetime.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.startDatetime.lte = new Date(endDate)
      }
    }

    // Specific ID filters
    if (tutorId) whereClause.tutorId = tutorId
    if (studentId) whereClause.userId = studentId
    if (courseId) whereClause.courseId = courseId

    // Search filter (across student name, tutor name, course title)
    if (search) {
      whereClause.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { tutor: { displayName: { contains: search, mode: 'insensitive' } } },
        { tutor: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { tutor: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { course: { titleFr: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Cursor pagination
    if (cursor) {
      whereClause.startDatetime = {
        ...whereClause.startDatetime,
        lt: new Date(cursor)
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        startDatetime: true,
        endDatetime: true,
        status: true,
        cancellationReason: true,
        cancelledAt: true,
        meetingLink: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            displayName: true,
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
            id: true,
            titleFr: true,
            slug: true
          }
        },
        orderItem: {
          select: {
            id: true,
            unitPriceCad: true,
            lineTotalCad: true,
            tutorEarningsCad: true
          }
        }
      },
      orderBy: { startDatetime: 'desc' },
      take: limit + 1
    })

    const hasMore = appointments.length > limit
    const nextCursor = hasMore ? appointments[limit - 1].startDatetime.toISOString() : null

    return {
      success: true,
      data: {
        appointments: appointments.slice(0, limit),
        hasMore,
        nextCursor
      }
    }
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get appointment details with modification history (admin only)
 */
export async function getAppointmentDetails(appointmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        startDatetime: true,
        endDatetime: true,
        status: true,
        cancellationReason: true,
        cancelledBy: true,
        cancelledAt: true,
        meetingLink: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        tutor: {
          select: {
            id: true,
            displayName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        course: {
          select: {
            id: true,
            titleFr: true,
            slug: true,
            studentRateCad: true
          }
        },
        orderItem: {
          select: {
            id: true,
            unitPriceCad: true,
            lineTotalCad: true,
            tutorEarningsCad: true,
            order: {
              select: {
                id: true,
                totalCad: true,
                stripePaymentIntentId: true,
                status: true
              }
            }
          }
        },
        modifications: {
          select: {
            id: true,
            modificationType: true,
            reason: true,
            oldData: true,
            newData: true,
            createdAt: true,
            modifier: {
              select: {
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!appointment) {
      return { success: false, error: 'Rendez-vous non trouvé' }
    }

    return { success: true, data: appointment }
  } catch (error) {
    console.error('Error fetching appointment details:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Create manual appointment (free for student, but tutor gets paid) (admin only)
 */
export async function createManualAppointment(data: {
  studentId: string
  tutorId: string
  courseId: string
  startDatetime: string
  endDatetime: string
  meetingLink?: string
  reason?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const { studentId, tutorId, courseId, startDatetime, endDatetime, meetingLink, reason } = data

    // Validate dates
    const start = new Date(startDatetime)
    const end = new Date(endDatetime)
    
    if (start >= end) {
      return { success: false, error: 'La date de fin doit être après la date de début' }
    }

    // Check for overlaps
    const overlappingAppointment = await prisma.appointment.findFirst({
      where: {
        tutorId,
        status: 'scheduled',
        OR: [
          {
            AND: [
              { startDatetime: { lt: end } },
              { endDatetime: { gt: start } }
            ]
          }
        ]
      }
    })

    if (overlappingAppointment) {
      return { success: false, error: 'Ce créneau chevauche avec un autre rendez-vous' }
    }

    // Get tutor rate and course rate
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { hourlyBaseRateCad: true }
    })

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { studentRateCad: true }
    })

    if (!tutor || !course) {
      return { success: false, error: 'Tuteur ou cours non trouvé' }
    }

    // Calculate duration and earnings
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    const tutorEarnings = (Number(tutor.hourlyBaseRateCad) * durationMinutes) / 60

    // Create manual order and order item
    const order = await prisma.order.create({
      data: {
        userId: studentId,
        subtotalCad: 0, // Free for student
        discountCad: 0,
        totalCad: 0, // Free for student
        status: 'paid', // Mark as paid since it's manual
        stripePaymentIntentId: `manual_${Date.now()}`
      }
    })

    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        courseId,
        tutorId,
        durationMin: Math.round(durationMinutes),
        unitPriceCad: 0, // Free for student
        lineTotalCad: 0, // Free for student
        tutorEarningsCad: tutorEarnings, // Tutor still gets paid
        startDatetime: start,
        endDatetime: end,
        earningsStatus: 'scheduled' // Start as scheduled - will become 'earned' when completed
      }
    })

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: studentId,
        tutorId,
        courseId,
        startDatetime: start,
        endDatetime: end,
        status: 'scheduled',
        orderItemId: orderItem.id,
        meetingLink
      }
    })

    // Log the manual creation
    await prisma.appointmentModification.create({
      data: {
        appointmentId: appointment.id,
        modifiedBy: user.id,
        modificationType: 'manual_creation',
        reason: reason || 'Création manuelle par administrateur',
        oldData: {},
        newData: {
          studentId,
          tutorId,
          courseId,
          startDatetime: start.toISOString(),
          endDatetime: end.toISOString(),
          meetingLink,
          tutorEarnings
        }
      }
    })

    revalidatePath('/admin')
    return { success: true, data: appointment }
  } catch (error) {
    console.error('Error creating manual appointment:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Update appointment status (admin only)
 */
export async function updateAppointmentStatus(
  appointmentId: string, 
  status: 'scheduled' | 'cancelled' | 'completed' | 'refunded',
  reason?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // Get current appointment data
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
        startDatetime: true,
        endDatetime: true,
        cancellationReason: true,
        cancelledBy: true,
        cancelledAt: true
      }
    })

    if (!currentAppointment) {
      return { success: false, error: 'Rendez-vous non trouvé' }
    }

    const oldData = {
      status: currentAppointment.status,
      cancellationReason: currentAppointment.cancellationReason,
      cancelledBy: currentAppointment.cancelledBy,
      cancelledAt: currentAppointment.cancelledAt
    }

    // Prepare update data
    const updateData: any = { status }

    if (status === 'cancelled') {
      updateData.cancellationReason = reason || 'Annulé par administrateur'
      updateData.cancelledBy = user.id
      updateData.cancelledAt = new Date()
    } else if (status === 'scheduled' && currentAppointment.status === 'cancelled') {
      // Rescheduling - clear cancellation data
      updateData.cancellationReason = null
      updateData.cancelledBy = null
      updateData.cancelledAt = null
    }

    const newData = {
      status,
      cancellationReason: updateData.cancellationReason,
      cancelledBy: updateData.cancelledBy,
      cancelledAt: updateData.cancelledAt
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        orderItem: {
          select: {
            id: true
          }
        }
      }
    })

    // If appointment is being marked as completed, update earningsStatus to 'earned'
    if (status === 'completed' && updatedAppointment.orderItem) {
      await prisma.orderItem.update({
        where: { id: updatedAppointment.orderItem.id },
        data: {
          earningsStatus: 'earned'
        }
      })
    }

    // If appointment is being cancelled or refunded, set earningsStatus to 'cancelled'
    if ((status === 'cancelled' || status === 'refunded') && updatedAppointment.orderItem) {
      await prisma.orderItem.update({
        where: { id: updatedAppointment.orderItem.id },
        data: {
          earningsStatus: 'cancelled'
        }
      })
    }

    // Log the modification
    await prisma.appointmentModification.create({
      data: {
        appointmentId,
        modifiedBy: user.id,
        modificationType: 'status_change',
        reason: reason || `Statut changé vers ${status}`,
        oldData,
        newData
      }
    })

    // Send webhooks based on status change
    try {
      const appointmentWithDetails = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: true,
          tutor: {
            include: { user: true }
          },
          course: true,
          orderItem: true
        }
      })

      if (appointmentWithDetails) {
        if (status === 'cancelled' && oldData.status !== 'cancelled') {
          // Send cancellation webhook
          await sendBookingCancelledWebhook({
            appointmentId: appointmentWithDetails.id,
            userId: appointmentWithDetails.userId,
            tutorId: appointmentWithDetails.tutorId,
            courseId: appointmentWithDetails.courseId,
            courseTitleFr: appointmentWithDetails.course.titleFr,
            cancelledBy: 'admin',
            cancelledById: user.id,
            cancellationReason: reason || 'Annulé par administrateur',
            startDatetime: appointmentWithDetails.startDatetime.toISOString(),
            endDatetime: appointmentWithDetails.endDatetime.toISOString(),
            durationMin: Math.round((appointmentWithDetails.endDatetime.getTime() - appointmentWithDetails.startDatetime.getTime()) / 60000),
            priceCad: appointmentWithDetails.orderItem ? Number(appointmentWithDetails.orderItem.lineTotalCad) : 0,
            timestamp: new Date().toISOString()
          })
        } else if (status === 'completed' && oldData.status !== 'completed') {
          // Send completion webhook
          await sendAppointmentCompletedWebhook({
            appointmentId: appointmentWithDetails.id,
            userId: appointmentWithDetails.userId,
            tutorId: appointmentWithDetails.tutorId,
            courseId: appointmentWithDetails.courseId,
            courseTitleFr: appointmentWithDetails.course.titleFr,
            startDatetime: appointmentWithDetails.startDatetime.toISOString(),
            endDatetime: appointmentWithDetails.endDatetime.toISOString(),
            durationMin: Math.round((appointmentWithDetails.endDatetime.getTime() - appointmentWithDetails.startDatetime.getTime()) / 60000),
            tutorEarningsCad: appointmentWithDetails.orderItem ? Number(appointmentWithDetails.orderItem.tutorEarningsCad) : 0,
            completedAt: new Date().toISOString()
          })
        }
      }
    } catch (webhookError) {
      // Don't fail the operation if webhook fails
      console.error('Error sending webhook:', webhookError)
    }

    revalidatePath('/admin')
    return { success: true, data: updatedAppointment }
  } catch (error) {
    console.error('Error updating appointment status:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Cancel appointment (admin only)
 */
export async function cancelAppointmentAdmin(appointmentId: string, reason: string) {
  return updateAppointmentStatus(appointmentId, 'cancelled', reason)
}

/**
 * Get tutors for autocomplete (admin only)
 */
export async function getTutorsForAutocomplete(search?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const tutors = await prisma.tutor.findMany({
      where: search ? {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      } : {},
      select: {
        id: true,
        displayName: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      take: 10
    })

    return { success: true, data: tutors }
  } catch (error) {
    console.error('Error fetching tutors:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get students for autocomplete (admin only)
 */
export async function getStudentsForAutocomplete(search?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      take: 10
    })

    return { success: true, data: students }
  } catch (error) {
    console.error('Error fetching students:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get courses for autocomplete (admin only)
 */
export async function getCoursesForAutocomplete(search?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const courses = await prisma.course.findMany({
      where: search ? {
        titleFr: { contains: search, mode: 'insensitive' }
      } : {},
      select: {
        id: true,
        titleFr: true,
        slug: true
      },
      take: 10
    })

    return { success: true, data: courses }
  } catch (error) {
    console.error('Error fetching courses:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// ============================================================================
// COMPREHENSIVE ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Get comprehensive financial analytics (admin only)
 */
export async function getFinancialAnalytics(year?: number, month?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const currentYear = year || new Date().getFullYear()
    const currentMonth = month || new Date().getMonth() + 1

    // Yearly data
    const yearlyStart = new Date(currentYear, 0, 1)
    const yearlyEnd = new Date(currentYear, 11, 31, 23, 59, 59)

    // Get all orders for the year
    const yearlyOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: yearlyStart,
          lte: yearlyEnd
        }
      },
      select: {
        id: true,
        totalCad: true,
        createdAt: true,
        items: {
          select: {
            tutorEarningsCad: true,
            earningsStatus: true,
            appointment: {
              select: {
                status: true
              }
            }
          }
        },
        refundRequests: {
          where: {
            status: {
              in: ['approved', 'processed']
            }
          },
          select: {
            amount: true,
            status: true
          }
        }
      }
    })

    // Get monthly orders
    const monthlyOrders = yearlyOrders.filter(order => {
      const orderMonth = order.createdAt.getMonth() + 1
      return orderMonth === currentMonth
    })

    // Calculate yearly metrics
    const yearlyRevenue = yearlyOrders.reduce((sum, order) => sum + Number(order.totalCad), 0)
    const yearlyRefunds = yearlyOrders.reduce((sum, order) => 
      sum + order.refundRequests.reduce((refundSum, refund) => refundSum + Number(refund.amount), 0), 0
    )
    const yearlyTutorPayments = yearlyOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => {
        // Accrual accounting: Count ALL tutor costs (scheduled + earned + paid)
        // Exclude cancelled appointments (they don't incur costs)
        if (item.earningsStatus && item.earningsStatus !== 'cancelled') {
          return itemSum + Number(item.tutorEarningsCad)
        }
        return itemSum
      }, 0), 0
    )
    const yearlyGrossMargin = yearlyRevenue - yearlyRefunds - yearlyTutorPayments
    const yearlyRefundRate = yearlyRevenue > 0 ? (yearlyRefunds / yearlyRevenue) * 100 : 0
    const yearlyGrossMarginPercent = yearlyRevenue > 0 ? (yearlyGrossMargin / yearlyRevenue) * 100 : 0
    const yearlyAvgOrderValue = yearlyOrders.length > 0 ? yearlyRevenue / yearlyOrders.length : 0

    // Calculate monthly metrics
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + Number(order.totalCad), 0)
    const monthlyRefunds = monthlyOrders.reduce((sum, order) => 
      sum + order.refundRequests.reduce((refundSum, refund) => refundSum + Number(refund.amount), 0), 0
    )
    const monthlyTutorPayments = monthlyOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => {
        // Accrual accounting: Count ALL tutor costs (scheduled + earned + paid)
        // Exclude cancelled appointments
        if (item.earningsStatus && item.earningsStatus !== 'cancelled') {
          return itemSum + Number(item.tutorEarningsCad)
        }
        return itemSum
      }, 0), 0
    )
    const monthlyGrossMargin = monthlyRevenue - monthlyRefunds - monthlyTutorPayments
    const monthlyAvgOrderValue = monthlyOrders.length > 0 ? monthlyRevenue / monthlyOrders.length : 0

    // Monthly breakdown for the year
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const monthOrders = yearlyOrders.filter(order => order.createdAt.getMonth() + 1 === month)
      const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.totalCad), 0)
      const monthRefunds = monthOrders.reduce((sum, order) => 
        sum + order.refundRequests.reduce((refundSum, refund) => refundSum + Number(refund.amount), 0), 0
      )
      const monthTutorPayments = monthOrders.reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => {
          // Accrual accounting: Count ALL tutor costs (scheduled + earned + paid)
          // Exclude cancelled appointments
          if (item.earningsStatus && item.earningsStatus !== 'cancelled') {
            return itemSum + Number(item.tutorEarningsCad)
          }
          return itemSum
        }, 0), 0
      )
      const monthGrossMargin = monthRevenue - monthRefunds - monthTutorPayments
      
      return {
        month,
        revenue: monthRevenue,
        refunds: monthRefunds,
        tutorPayments: monthTutorPayments,
        grossMargin: monthGrossMargin,
        orders: monthOrders.length
      }
    })

    return {
      success: true,
      data: {
        yearly: {
          revenue: yearlyRevenue,
          refunds: yearlyRefunds,
          refundRate: yearlyRefundRate,
          avgOrderValue: yearlyAvgOrderValue,
          grossMargin: yearlyGrossMargin,
          grossMarginPercent: yearlyGrossMarginPercent,
          tutorPayments: yearlyTutorPayments,
          orders: yearlyOrders.length
        },
        monthly: {
          revenue: monthlyRevenue,
          refunds: monthlyRefunds,
          avgOrderValue: monthlyAvgOrderValue,
          grossMargin: monthlyGrossMargin,
          tutorPayments: monthlyTutorPayments,
          orders: monthlyOrders.length
        },
        monthlyBreakdown
      }
    }
  } catch (error) {
    console.error('Error fetching financial analytics:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get operational metrics (admin only)
 */
export async function getOperationalMetrics() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    // Yearly data
    const yearlyStart = new Date(currentYear, 0, 1)
    const yearlyEnd = new Date(currentYear, 11, 31, 23, 59, 59)

    // Monthly data
    const monthlyStart = new Date(currentYear, currentMonth - 1, 1)
    const monthlyEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

    // Get counts
    const [activeCourses, activeTutors, yearlyOrders, monthlyOrders, tutorOutstanding] = await Promise.all([
      prisma.course.count({ where: { active: true } }),
      prisma.tutor.count({ where: { active: true } }),
      prisma.order.count({ 
        where: { 
          createdAt: { gte: yearlyStart, lte: yearlyEnd } 
        } 
      }),
      prisma.order.count({ 
        where: { 
          createdAt: { gte: monthlyStart, lte: monthlyEnd } 
        } 
      }),
      prisma.orderItem.aggregate({
        where: {
          earningsStatus: 'earned',
          paidAt: null,
          appointment: {
            status: 'completed'
          }
        },
        _sum: {
          tutorEarningsCad: true
        }
      })
    ])

    return {
      success: true,
      data: {
        activeCourses,
        activeTutors,
        yearlyOrders,
        monthlyOrders,
        tutorOutstanding: Number(tutorOutstanding._sum.tutorEarningsCad || 0)
      }
    }
  } catch (error) {
    console.error('Error fetching operational metrics:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get performance analytics (admin only)
 */
export async function getPerformanceAnalytics(year?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const currentYear = year || new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59)

    // Get all orders for the year
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        id: true,
        totalCad: true,
        userId: true,
        items: {
          select: {
            course: {
              select: {
                id: true,
                titleFr: true
              }
            },
            tutor: {
              select: {
                id: true,
                displayName: true
              }
            }
          }
        }
      }
    })

    // Get appointments for the year
    const appointments = await prisma.appointment.findMany({
      where: {
        startDatetime: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        id: true,
        tutorId: true,
        tutor: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    })

    // Top courses
    const courseStats = new Map()
    orders.forEach(order => {
      order.items.forEach(item => {
        const courseId = item.course.id
        const courseTitle = item.course.titleFr
        if (!courseStats.has(courseId)) {
          courseStats.set(courseId, { title: courseTitle, count: 0 })
        }
        courseStats.get(courseId).count++
      })
    })

    const topCourses = Array.from(courseStats.entries())
      .map(([id, data]) => ({ id, title: data.title, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Top tutors
    const tutorStats = new Map()
    appointments.forEach(appointment => {
      const tutorId = appointment.tutor.id
      const tutorName = appointment.tutor.displayName
      if (!tutorStats.has(tutorId)) {
        tutorStats.set(tutorId, { name: tutorName, appointments: 0 })
      }
      tutorStats.get(tutorId).appointments++
    })

    const topTutors = Array.from(tutorStats.entries())
      .map(([id, data]) => ({ id, name: data.name, appointments: data.appointments }))
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 5)

    // Top students
    const studentStats = new Map()
    orders.forEach(order => {
      const userId = order.userId
      if (!studentStats.has(userId)) {
        studentStats.set(userId, { totalSpent: 0, orderCount: 0 })
      }
      const stats = studentStats.get(userId)
      stats.totalSpent += Number(order.totalCad)
      stats.orderCount++
    })

    // Get student names
    const studentIds = Array.from(studentStats.keys())
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true }
    })

    const topStudents = Array.from(studentStats.entries())
      .map(([id, stats]) => {
        const student = students.find(s => s.id === id)
        return {
          id,
          name: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          totalSpent: stats.totalSpent,
          orderCount: stats.orderCount
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    return {
      success: true,
      data: {
        topCourses,
        topTutors,
        topStudents
      }
    }
  } catch (error) {
    console.error('Error fetching performance analytics:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get system health indicators (admin only)
 */
export async function getSystemHealth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // Database health
    const dbHealth = await prisma.$queryRaw`SELECT 1 as healthy`
    const databaseStatus = dbHealth ? 'healthy' : 'unhealthy'

    // Stripe API health (simplified check)
    const stripeStatus = process.env.STRIPE_SECRET_KEY ? 'healthy' : 'unhealthy'

    // Error rate (last 24 hours) - simplified
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const errorCount = await prisma.webhookEvent.count({
      where: {
        type: { contains: 'error' },
        createdAt: { gte: yesterday }
      }
    })

    const totalEvents = await prisma.webhookEvent.count({
      where: {
        createdAt: { gte: yesterday }
      }
    })

    const errorRate = totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0
    const errorStatus = errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'unhealthy'

    // Uptime (simplified - based on recent activity)
    const recentActivity = await prisma.order.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })
    const uptimeStatus = recentActivity > 0 ? 'healthy' : 'warning'

    return {
      success: true,
      data: {
        database: { status: databaseStatus, message: databaseStatus === 'healthy' ? 'Connected' : 'Disconnected' },
        stripe: { status: stripeStatus, message: stripeStatus === 'healthy' ? 'API Key Present' : 'No API Key' },
        errors: { status: errorStatus, message: `${errorRate.toFixed(1)}% error rate`, rate: errorRate },
        uptime: { status: uptimeStatus, message: uptimeStatus === 'healthy' ? 'Active' : 'No recent activity' }
      }
    }
  } catch (error) {
    console.error('Error fetching system health:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get support tickets (placeholder) (admin only)
 */
export async function getSupportTickets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const unresolvedStatuses = ['open', 'in_progress'] as const

    const [totalCount, recentTickets] = await Promise.all([
      prisma.supportTicket.count({
        where: {
          status: { in: unresolvedStatuses as unknown as any }
        }
      }),
      prisma.supportTicket.findMany({
        where: {
          status: { in: unresolvedStatuses as unknown as any }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true
        }
      })
    ])

    return {
      success: true,
      data: {
        totalCount,
        recentTickets
      }
    }
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get revenue breakdown by course and tutor (admin only)
 */
export async function getRevenueBreakdown(year?: number, month?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const currentYear = year || new Date().getFullYear()
    const currentMonth = month || new Date().getMonth() + 1

    // Yearly data
    const yearlyStart = new Date(currentYear, 0, 1)
    const yearlyEnd = new Date(currentYear, 11, 31, 23, 59, 59)

    // Get orders with items
    const yearlyOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: yearlyStart,
          lte: yearlyEnd
        }
      },
      select: {
        id: true,
        totalCad: true,
        createdAt: true,
        items: {
          select: {
            lineTotalCad: true,
            course: {
              select: {
                id: true,
                titleFr: true
              }
            },
            tutor: {
              select: {
                id: true,
                displayName: true
              }
            }
          }
        }
      }
    })

    // Revenue by course
    const courseRevenue = new Map()
    yearlyOrders.forEach(order => {
      order.items.forEach(item => {
        const courseId = item.course.id
        const courseTitle = item.course.titleFr
        if (!courseRevenue.has(courseId)) {
          courseRevenue.set(courseId, { title: courseTitle, yearly: 0, monthly: 0 })
        }
        const revenue = courseRevenue.get(courseId)
        revenue.yearly += Number(item.lineTotalCad)
        
        const orderMonth = order.createdAt.getMonth() + 1
        if (orderMonth === currentMonth) {
          revenue.monthly += Number(item.lineTotalCad)
        }
      })
    })

    // Revenue by tutor
    const tutorRevenue = new Map()
    yearlyOrders.forEach(order => {
      order.items.forEach(item => {
        const tutorId = item.tutor.id
        const tutorName = item.tutor.displayName
        if (!tutorRevenue.has(tutorId)) {
          tutorRevenue.set(tutorId, { name: tutorName, yearly: 0, monthly: 0 })
        }
        const revenue = tutorRevenue.get(tutorId)
        revenue.yearly += Number(item.lineTotalCad)
        
        const orderMonth = order.createdAt.getMonth() + 1
        if (orderMonth === currentMonth) {
          revenue.monthly += Number(item.lineTotalCad)
        }
      })
    })

    return {
      success: true,
      data: {
        byCourse: {
          yearly: Array.from(courseRevenue.values()).sort((a, b) => b.yearly - a.yearly),
          monthly: Array.from(courseRevenue.values()).sort((a, b) => b.monthly - a.monthly)
        },
        byTutor: {
          yearly: Array.from(tutorRevenue.values()).sort((a, b) => b.yearly - a.yearly),
          monthly: Array.from(tutorRevenue.values()).sort((a, b) => b.monthly - a.monthly)
        }
      }
    }
  } catch (error) {
    console.error('Error fetching revenue breakdown:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// ============================================================================
// ORDER MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all orders with filters (admin only)
 */
export async function getAllOrders(params: {
  status?: 'created' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'all'
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  tutorId?: string
  studentId?: string
  courseId?: string
  search?: string
  cursor?: string
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const {
      status = 'all',
      startDate,
      endDate,
      minAmount,
      maxAmount,
      tutorId,
      studentId,
      courseId,
      search = '',
      cursor,
      limit = 20
    } = params

    // Build where clause
    const whereClause: any = {}

    // Status filter
    if (status !== 'all') {
      whereClause.status = status
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      whereClause.totalCad = {}
      if (minAmount !== undefined) {
        whereClause.totalCad.gte = minAmount
      }
      if (maxAmount !== undefined) {
        whereClause.totalCad.lte = maxAmount
      }
    }

    // Specific ID filters
    if (studentId) whereClause.userId = studentId

    // Search filter (across student name, order ID, payment intent ID)
    if (search) {
      whereClause.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { id: { contains: search, mode: 'insensitive' } },
        { stripePaymentIntentId: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Cursor pagination
    if (cursor) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lt: new Date(cursor)
      }
    }

    // Additional filters for tutor/course through order items
    const orderItemWhere: any = {}
    if (tutorId) orderItemWhere.tutorId = tutorId
    if (courseId) orderItemWhere.courseId = courseId

    const orders = await prisma.order.findMany({
      where: {
        ...whereClause,
        ...(Object.keys(orderItemWhere).length > 0 ? {
          items: {
            some: orderItemWhere
          }
        } : {})
      },
      select: {
        id: true,
        totalCad: true,
        status: true,
        createdAt: true,
        stripePaymentIntentId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: {
          select: {
            id: true,
            course: {
              select: {
                id: true,
                titleFr: true
              }
            },
            tutor: {
              select: {
                id: true,
                displayName: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            startDatetime: true,
            endDatetime: true,
            unitPriceCad: true,
            lineTotalCad: true,
            tutorEarningsCad: true
          }
        },
        refundRequests: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1
    })

    const hasMore = orders.length > limit
    const nextCursor = hasMore ? orders[limit - 1].createdAt.toISOString() : null

    return {
      success: true,
      data: {
        orders: orders.slice(0, limit),
        hasMore,
        nextCursor
      }
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get order details (admin only)
 */
export async function getOrderDetails(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        subtotalCad: true,
        discountCad: true,
        totalCad: true,
        currency: true,
        status: true,
        createdAt: true,
        stripePaymentIntentId: true,
        stripeCheckoutSessionId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        items: {
          select: {
            id: true,
            startDatetime: true,
            endDatetime: true,
            durationMin: true,
            unitPriceCad: true,
            lineTotalCad: true,
            tutorEarningsCad: true,
            course: {
              select: {
                id: true,
                titleFr: true,
                slug: true
              }
            },
            tutor: {
              select: {
                id: true,
                displayName: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            appointment: {
              select: {
                id: true,
                status: true,
                meetingLink: true
              }
            }
          }
        },
        refundRequests: {
          select: {
            id: true,
            amount: true,
            reason: true,
            status: true,
            stripeRefundId: true,
            processedAt: true,
            createdAt: true,
            processor: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!order) {
      return { success: false, error: 'Commande non trouvée' }
    }

    return { success: true, data: order }
  } catch (error) {
    console.error('Error fetching order details:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Process order refund (admin only)
 */
export async function refundOrder(
  orderId: string, 
  amount: number, 
  reason: string,
  cancelAppointments: boolean = true
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // Get order details with existing refunds
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalCad: true,
        status: true,
        stripePaymentIntentId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          select: {
            id: true,
            appointment: {
              select: {
                id: true,
                status: true
              }
            }
          }
        },
        refundRequests: {
          where: {
            status: {
              in: ['approved', 'processed']
            }
          },
          select: {
            id: true,
            amount: true,
            stripeRefundId: true,
            status: true
          }
        }
      }
    })

    if (!order) {
      return { success: false, error: 'Commande non trouvée' }
    }

    // Calculate total already refunded
    const totalRefunded = order.refundRequests.reduce((sum, refund) => sum + Number(refund.amount), 0)
    const remainingAmount = Number(order.totalCad) - totalRefunded

    if (order.status === 'refunded') {
      return { success: false, error: 'Cette commande a déjà été remboursée intégralement' }
    }

    if (amount > remainingAmount) {
      return { 
        success: false, 
        error: `Le montant du remboursement ne peut pas dépasser le montant restant ($${remainingAmount.toFixed(2)} CAD)` 
      }
    }

    // Check if refund with same amount and Stripe ID already exists (idempotency)
    if (order.stripePaymentIntentId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        
        // First, check if there's already a refund for this payment intent in Stripe
        const existingStripeRefunds = await stripe.refunds.list({
          payment_intent: order.stripePaymentIntentId,
          limit: 100
        })

        // Check if we already have a refund record for any of these Stripe refunds
        const existingStripeRefundIds = order.refundRequests
          .map(r => r.stripeRefundId)
          .filter(Boolean) as string[]

        // Find if there's a Stripe refund that matches our amount but isn't in our DB
        const matchingStripeRefund = existingStripeRefunds.data.find(
          (refund: any) => 
            Math.abs(refund.amount / 100 - amount) < 0.01 && // Amount matches (within 1 cent)
            !existingStripeRefundIds.includes(refund.id)
        )

        let stripeRefundId: string | null = null

        if (matchingStripeRefund) {
          // Stripe refund exists but not in our DB - reconcile it
          console.log('Found existing Stripe refund, reconciling:', matchingStripeRefund.id)
          stripeRefundId = matchingStripeRefund.id
        } else {
          // Create new Stripe refund
          const refund = await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            amount: Math.round(amount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              orderId: orderId,
              reason: reason,
              processedBy: user.id
            }
          })
          stripeRefundId = refund.id
        }

        // Now proceed with database operations using the stripeRefundId
        return await processRefundDatabaseOperations(orderId, order, amount, reason, stripeRefundId, user.id, cancelAppointments)
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError)
        
        // If Stripe says refund already exists, try to reconcile
        if (stripeError.code === 'refund_already_exists' || stripeError.message?.includes('already been refunded')) {
          // Try to find the existing refund in Stripe
          try {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
            const existingRefunds = await stripe.refunds.list({
              payment_intent: order.stripePaymentIntentId,
              limit: 100
            })
            
            const matchingRefund = existingRefunds.data.find(
              (refund: any) => Math.abs(refund.amount / 100 - amount) < 0.01
            )

            if (matchingRefund) {
              // Reconcile the existing refund
              return await processRefundDatabaseOperations(
                orderId, 
                order, 
                amount, 
                reason, 
                matchingRefund.id, 
                user.id, 
                cancelAppointments
              )
            }
          } catch (reconcileError) {
            console.error('Error reconciling refund:', reconcileError)
          }
        }

        return { 
          success: false, 
          error: `Erreur lors du remboursement Stripe: ${stripeError.message || 'Erreur inconnue'}` 
        }
      }
    } else {
      // No Stripe payment - just process database operations
      return await processRefundDatabaseOperations(orderId, order, amount, reason, null, user.id, cancelAppointments)
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Une erreur est survenue' }
  }
}

/**
 * Helper function to process refund database operations
 * This is separated to allow reconciliation of existing Stripe refunds
 */
async function processRefundDatabaseOperations(
  orderId: string,
  order: any,
  amount: number,
  reason: string,
  stripeRefundId: string | null,
  userId: string,
  cancelAppointments: boolean
) {
  try {
    // Check if refund already exists (idempotency check)
    if (stripeRefundId) {
      const existingRefund = await prisma.refundRequest.findFirst({
        where: {
          stripeRefundId: stripeRefundId,
          orderId: orderId
        }
      })

      if (existingRefund) {
        console.log('Refund already exists in database, returning existing record')
        return { success: true, data: { refundId: stripeRefundId, existing: true } }
      }
    }

    // Calculate total already refunded to determine new status
    const totalRefunded = order.refundRequests.reduce((sum: number, refund: any) => sum + Number(refund.amount), 0)
    const newTotalRefunded = totalRefunded + amount
    const isFullRefund = newTotalRefunded >= Number(order.totalCad)
    const newStatus = isFullRefund ? 'refunded' : 'partially_refunded'

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    })

    // Create refund request record
    // For order-level refunds, use the first appointment ID if available
    const firstAppointmentId = order.items.find((item: any) => item.appointment?.id)?.appointment?.id
    
    if (!firstAppointmentId) {
      // If no appointment, we need to find any appointment for this order or create a minimal one
      // Since appointmentId is required in schema, we need to handle this
      const orderWithAppointments = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              appointment: {
                select: { id: true }
              }
            }
          }
        }
      })
      
      const anyAppointmentId = orderWithAppointments?.items.find((item: any) => item.appointment?.id)?.appointment?.id
      
      if (!anyAppointmentId) {
        return { 
          success: false, 
          error: 'Impossible de créer le remboursement: aucun rendez-vous associé à cette commande' 
        }
      }
      
      // Use the found appointment ID
      await prisma.refundRequest.create({
        data: {
          userId: order.user.id,
          appointmentId: anyAppointmentId,
          orderId: orderId,
          amount: amount,
          reason: reason,
          status: 'processed',
          stripeRefundId: stripeRefundId,
          processedBy: userId,
          processedAt: new Date()
        }
      })
    } else {
      // Create refund request with appointment ID
      await prisma.refundRequest.create({
        data: {
          userId: order.user.id,
          appointmentId: firstAppointmentId,
          orderId: orderId,
          amount: amount,
          reason: reason,
          status: 'processed',
          stripeRefundId: stripeRefundId,
          processedBy: userId,
          processedAt: new Date()
        }
      })
    }

    // Cancel appointments if requested
    if (cancelAppointments) {
      const appointmentIds = order.items
        .map((item: any) => item.appointment?.id)
        .filter(Boolean) as string[]

      if (appointmentIds.length > 0) {
        await prisma.appointment.updateMany({
          where: {
            id: { in: appointmentIds },
            status: 'scheduled'
          },
          data: {
            status: 'cancelled',
            cancellationReason: `Remboursement de commande: ${reason}`,
            cancelledBy: userId,
            cancelledAt: new Date()
          }
        })

        // Log the cancellations
        for (const appointmentId of appointmentIds) {
          try {
            await prisma.appointmentModification.create({
              data: {
                appointmentId,
                modifiedBy: userId,
                modificationType: 'cancel',
                reason: `Annulé suite au remboursement de commande: ${reason}`,
                oldData: { status: 'scheduled' },
                newData: { status: 'cancelled' }
              }
            })
          } catch (modError) {
            // Don't fail the refund if modification logging fails
            console.error('Error logging appointment modification:', modError)
          }
        }
      }
    }

    // Send refund webhook
    try {
      const { sendOrderRefundedWebhook } = await import('@/lib/webhooks/make')
      const affectedAppointmentIds = cancelAppointments 
        ? order.items.map((item: any) => item.appointment?.id).filter(Boolean) as string[]
        : []

      await sendOrderRefundedWebhook({
        orderId: orderId,
        userId: order.user.id,
        refundAmount: amount,
        refundReason: reason,
        stripeRefundId: stripeRefundId || undefined,
        processedBy: userId,
        affectedAppointments: affectedAppointmentIds,
        timestamp: new Date().toISOString()
      })
    } catch (webhookError) {
      // Don't fail the refund if webhook fails
      console.error('Error sending refund webhook:', webhookError)
    }

    revalidatePath('/admin')
    return { success: true, data: { refundId: stripeRefundId } }
  } catch (error) {
    console.error('Error in processRefundDatabaseOperations:', error)
    console.error('Error details:', {
      orderId,
      amount,
      stripeRefundId,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    })
    
    // If we have a Stripe refund ID but DB failed, log it for manual reconciliation
    if (stripeRefundId) {
      console.error('CRITICAL: Stripe refund succeeded but database update failed. Stripe Refund ID:', stripeRefundId)
      console.error('This refund needs to be manually reconciled in the database.')
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? `Erreur lors de la mise à jour de la base de données: ${error.message}` : 'Une erreur est survenue lors de la mise à jour de la base de données' 
    }
  }
}

/**
 * Get order analytics (admin only)
 */
export async function getOrderAnalytics(year?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const currentYear = year || new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59)

    // Get all orders for the year
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        id: true,
        totalCad: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            course: {
              select: {
                id: true,
                titleFr: true
              }
            },
            tutor: {
              select: {
                id: true,
                displayName: true
              }
            },
            tutorEarningsCad: true
          }
        },
        refundRequests: {
          select: {
            amount: true
          }
        }
      }
    })

    // Calculate analytics
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalCad), 0)
    const totalRefunded = orders.reduce((sum, order) => 
      sum + order.refundRequests.reduce((refundSum, refund) => refundSum + Number(refund.amount), 0), 0
    )
    const refundRate = totalRevenue > 0 ? (totalRefunded / totalRevenue) * 100 : 0
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

    // Monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const monthOrders = orders.filter(order => order.createdAt.getMonth() + 1 === month)
      const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.totalCad), 0)
      return {
        month,
        orders: monthOrders.length,
        revenue: monthRevenue
      }
    })

    // Top courses
    const courseStats = new Map()
    orders.forEach(order => {
      order.items.forEach(item => {
        const courseId = item.course.id
        const courseTitle = item.course.titleFr
        if (!courseStats.has(courseId)) {
          courseStats.set(courseId, { title: courseTitle, count: 0 })
        }
        courseStats.get(courseId).count++
      })
    })

    const topCourses = Array.from(courseStats.entries())
      .map(([id, data]) => ({ id, title: data.title, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Top tutors
    const tutorStats = new Map()
    orders.forEach(order => {
      order.items.forEach(item => {
        const tutorId = item.tutor.id
        const tutorName = item.tutor.displayName
        if (!tutorStats.has(tutorId)) {
          tutorStats.set(tutorId, { name: tutorName, appointments: 0 })
        }
        tutorStats.get(tutorId).appointments++
      })
    })

    const topTutors = Array.from(tutorStats.entries())
      .map(([id, data]) => ({ id, name: data.name, appointments: data.appointments }))
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 5)

    return {
      success: true,
      data: {
        totalRevenue,
        totalRefunded,
        refundRate,
        averageOrderValue,
        totalOrders: orders.length,
        monthlyData,
        topCourses,
        topTutors
      }
    }
  } catch (error) {
    console.error('Error fetching order analytics:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// ============================================================================
// SUPPORT TICKET MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all support tickets with filters (admin only)
 */
export async function getAllSupportTickets(params: {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'all'
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'all'
  category?: string
  assignedTo?: string | 'unassigned' | 'all'
  startDate?: string
  endDate?: string
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
  cursor?: string
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const limit = params.limit || 20
    const status = params.status || 'all'
    const priority = params.priority || 'all'
    const category = params.category || 'all'
    const assignedTo = params.assignedTo || 'all'
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'desc'
    const search = params.search?.toLowerCase() || ''

    // Build where clause
    const where: any = {}

    if (status !== 'all') {
      where.status = status
    }

    if (priority !== 'all') {
      where.priority = priority
    }

    if (category !== 'all') {
      where.category = category
    }

    if (assignedTo === 'unassigned') {
      where.assignedTo = null
    } else if (assignedTo !== 'all' && assignedTo) {
      where.assignedTo = assignedTo
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate)
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate)
      }
    }

    // Search filter (subject or description)
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } }
      ]
    }

    // Build cursor condition
    const cursorWhere = params.cursor ? {
      createdAt: sortOrder === 'desc' ? { lt: new Date(params.cursor) } : { gt: new Date(params.cursor) }
    } : {}

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder
    } else if (sortBy === 'priority') {
      orderBy.priority = sortOrder
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder
    }

    // Get tickets
    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...where,
        ...cursorWhere
      },
      orderBy,
      take: limit + 1,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    const hasMore = tickets.length > limit
    const data = hasMore ? tickets.slice(0, limit) : tickets
    const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null

    return {
      success: true,
      data: data.map(ticket => ({
        ...ticket,
        messageCount: ticket._count.messages
      })),
      nextCursor
    }
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get ticket details (admin version - includes internal messages)
 */
export async function getTicketDetailsAdmin(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        appointment: {
          include: {
            course: {
              select: {
                titleFr: true
              }
            },
            tutor: {
              select: {
                displayName: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            totalCad: true,
            status: true,
            createdAt: true
          }
        },
        attachments: true,
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!ticket) {
      return { success: false, error: 'Ticket non trouvé' }
    }

    return { success: true, data: ticket }
  } catch (error) {
    console.error('Error fetching ticket details:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Update ticket status (admin only)
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  reason?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // Get current ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!ticket) {
      return { success: false, error: 'Ticket non trouvé' }
    }

    const oldStatus = ticket.status

    // Update ticket
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    // Auto-set resolvedAt if status = resolved
    if (status === 'resolved' && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date()
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    // Send webhook
    await sendTicketStatusChangedWebhook({
      ticketId,
      userId: ticket.userId,
      userEmail: updatedTicket.user.email,
      oldStatus,
      newStatus: status,
      changedBy: user.id,
      reason,
      timestamp: new Date().toISOString()
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: updatedTicket }
  } catch (error) {
    console.error('Error updating ticket status:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Update ticket priority (admin only)
 */
export async function updateTicketPriority(
  ticketId: string,
  priority: 'low' | 'medium' | 'high' | 'urgent'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!ticket) {
      return { success: false, error: 'Ticket non trouvé' }
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        priority,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    // Send webhook (optional - status change webhook)
    await sendTicketStatusChangedWebhook({
      ticketId,
      userId: ticket.userId,
      userEmail: updatedTicket.user.email,
      oldStatus: ticket.status,
      newStatus: ticket.status,
      changedBy: user.id,
      timestamp: new Date().toISOString()
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: updatedTicket }
  } catch (error) {
    console.error('Error updating ticket priority:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Assign ticket to admin (admin only)
 */
export async function assignTicket(ticketId: string, adminId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // If assigning to someone, verify they are admin
    if (adminId) {
      const assignee = await prisma.user.findUnique({
        where: { id: adminId },
        select: { role: true }
      })

      if (!assignee || assignee.role !== 'admin') {
        return { success: false, error: 'L\'utilisateur assigné doit être un administrateur' }
      }
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!ticket) {
      return { success: false, error: 'Ticket non trouvé' }
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo: adminId,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Send webhook
    await sendTicketStatusChangedWebhook({
      ticketId,
      userId: ticket.userId,
      userEmail: updatedTicket.user.email,
      oldStatus: ticket.status,
      newStatus: ticket.status,
      changedBy: user.id,
      timestamp: new Date().toISOString()
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: updatedTicket }
  } catch (error) {
    console.error('Error assigning ticket:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Add message to ticket (admin version - can add internal notes)
 */
export async function addTicketMessageAdmin(
  ticketId: string,
  message: string,
  isInternal: boolean = false,
  _attachmentIds?: string[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  // Validate message
  if (!message || message.trim().length < 1 || message.length > 5000) {
    return { success: false, error: 'Le message doit contenir entre 1 et 5000 caractères' }
  }

  try {
    // Verify ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!ticket) {
      return { success: false, error: 'Ticket non trouvé' }
    }

    // Create message
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        userId: user.id,
        message: message.trim(),
        isInternal
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Update ticket updatedAt
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    })

    // Send webhook (only for non-internal messages)
    if (!isInternal) {
      await sendTicketMessageWebhook({
        ticketId,
        messageId: ticketMessage.id,
        userId: user.id,
        userEmail: ticketMessage.user.email,
        senderRole: ticketMessage.user.role,
        message: ticketMessage.message,
        isInternal: false,
        timestamp: ticketMessage.createdAt.toISOString()
      })
    }

    revalidatePath('/tableau-de-bord')
    return { success: true, data: ticketMessage }
  } catch (error) {
    console.error('Error adding ticket message:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get list of admins for assignment dropdown
 */
export async function getAdminsForAssignment() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser?.role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'admin'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      orderBy: {
        firstName: 'asc'
      }
    })

    return { success: true, data: admins }
  } catch (error) {
    console.error('Error fetching admins:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

