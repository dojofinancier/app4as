'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendSignupWebhook } from '@/lib/webhooks/make'

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
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
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
      createdAt: user.createdAt.toISOString(),
    })

    revalidatePath('/admin/tuteurs')
    return { 
      success: true, 
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

    return { success: true, data: tutors }
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

