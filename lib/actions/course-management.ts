'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'

export interface CourseData {
  id: string
  code: string
  slug: string
  titleFr: string
  descriptionFr: string
  institution?: string
  domain?: string
  active: boolean
  studentRateCad: number
  createdAt: Date
  _count?: {
    appointments: number
    tutorCourses: number
  }
}

export interface CourseAnalytics {
  totalBookings: number
  totalStudentRevenue: number
  totalTutorCosts: number
  grossMargin: number
  marginPercentage: number
  assignedTutors: number
  activeStudents: number
}

export interface TutorAssignment {
  id: string
  tutorId: string
  courseId: string
  status: string
  assignedAt: Date
  assignedBy?: string
  tutor: {
    id: string
    displayName: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

/**
 * Get all courses with optional filtering
 */
export async function getAllCourses(filters?: {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  institution?: string
  domain?: string
}): Promise<{ success: boolean; data?: CourseData[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    const where: any = {}
    
    if (filters?.status && filters.status !== 'all') {
      where.active = filters.status === 'active'
    }
    
    if (filters?.institution) {
      where.institution = {
        contains: filters.institution,
        mode: 'insensitive'
      }
    }
    
    if (filters?.domain) {
      where.domain = {
        contains: filters.domain,
        mode: 'insensitive'
      }
    }
    
    if (filters?.search) {
      where.OR = [
        { titleFr: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { institution: { contains: filters.search, mode: 'insensitive' } },
        { domain: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: {
          select: {
            appointments: true,
            tutorCourses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedCourses: CourseData[] = courses.map(course => ({
      id: course.id,
      code: course.code,
      slug: course.slug,
      titleFr: course.titleFr,
      descriptionFr: course.descriptionFr,
      institution: course.institution || undefined,
      domain: course.domain || undefined,
      active: course.active,
      studentRateCad: Number(course.studentRateCad),
      createdAt: course.createdAt,
      _count: course._count
    }))

    return { success: true, data: formattedCourses }
  } catch (error) {
    console.error('Error fetching courses:', error)
    return { success: false, error: 'Erreur lors de la récupération des cours' }
  }
}

/**
 * Create a new course
 */
export async function createCourse(data: {
  code: string
  titleFr: string
  descriptionFr: string
  institution?: string
  domain?: string
  studentRateCad: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    // Generate slug from code
    const slug = data.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Check if code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code: data.code }
    })

    if (existingCourse) {
      return { success: false, error: 'Un cours avec ce code existe déjà' }
    }

    // Check if slug already exists
    const existingSlug = await prisma.course.findUnique({
      where: { slug }
    })

    if (existingSlug) {
      return { success: false, error: 'Un cours avec ce slug existe déjà' }
    }

    await prisma.course.create({
      data: {
        code: data.code,
        slug,
        titleFr: data.titleFr,
        descriptionFr: data.descriptionFr,
        institution: data.institution,
        domain: data.domain,
        studentRateCad: data.studentRateCad
      }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error creating course:', error)
    return { success: false, error: 'Erreur lors de la création du cours' }
  }
}

/**
 * Update a course
 */
export async function updateCourse(
  courseId: string,
  data: {
    code?: string
    titleFr?: string
    descriptionFr?: string
    institution?: string
    domain?: string
    studentRateCad?: number
    active?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!existingCourse) {
      return { success: false, error: 'Cours non trouvé' }
    }

    // If code is being changed, check for conflicts
    if (data.code && data.code !== existingCourse.code) {
      const codeExists = await prisma.course.findUnique({
        where: { code: data.code }
      })

      if (codeExists) {
        return { success: false, error: 'Un cours avec ce code existe déjà' }
      }
    }

    // Generate new slug if code is changing
    const updateData: any = { ...data }
    if (data.code) {
      const newSlug = data.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      updateData.slug = newSlug
    }

    await prisma.course.update({
      where: { id: courseId },
      data: updateData
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error updating course:', error)
    return { success: false, error: 'Erreur lors de la mise à jour du cours' }
  }
}

/**
 * Soft delete a course (check for appointments first)
 */
export async function deleteCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    // Check if course has appointments
    const appointmentCount = await prisma.appointment.count({
      where: { courseId }
    })

    if (appointmentCount > 0) {
      // Soft delete - mark as inactive
      await prisma.course.update({
        where: { id: courseId },
        data: { active: false }
      })
    } else {
      // Hard delete - no appointments
      await prisma.course.delete({
        where: { id: courseId }
      })
    }

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error deleting course:', error)
    return { success: false, error: 'Erreur lors de la suppression du cours' }
  }
}

/**
 * Get course analytics
 */
export async function getCourseAnalytics(courseId: string): Promise<{ success: boolean; data?: CourseAnalytics; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    // Get completed appointments for this course
    const appointments = await prisma.appointment.findMany({
      where: {
        courseId,
        status: 'completed'
      },
      include: {
        orderItem: {
          select: {
            lineTotalCad: true,
            tutorEarningsCad: true
          }
        }
      }
    })

    // Calculate analytics
    const totalBookings = appointments.length
    const totalStudentRevenue = appointments.reduce((sum, apt) => 
      sum + Number(apt.orderItem?.lineTotalCad || 0), 0
    )
    const totalTutorCosts = appointments.reduce((sum, apt) => 
      sum + Number(apt.orderItem?.tutorEarningsCad || 0), 0
    )
    const grossMargin = totalStudentRevenue - totalTutorCosts
    const marginPercentage = totalStudentRevenue > 0 ? (grossMargin / totalStudentRevenue) * 100 : 0

    // Get assigned tutors count
    const assignedTutors = await prisma.tutorCourse.count({
      where: {
        courseId,
        status: 'approved'
      }
    })

    // Get active students count (students who have booked this course)
    const activeStudents = await prisma.appointment.groupBy({
      by: ['userId'],
      where: {
        courseId,
        status: 'completed'
      }
    })

    const analytics: CourseAnalytics = {
      totalBookings,
      totalStudentRevenue,
      totalTutorCosts,
      grossMargin,
      marginPercentage,
      assignedTutors,
      activeStudents: activeStudents.length
    }

    return { success: true, data: analytics }
  } catch (error) {
    console.error('Error fetching course analytics:', error)
    return { success: false, error: 'Erreur lors de la récupération des analyses' }
  }
}

/**
 * Get tutors assigned to a course
 */
export async function getCourseTutors(courseId: string): Promise<{ success: boolean; data?: TutorAssignment[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    const tutorCourses = await prisma.tutorCourse.findMany({
      where: { courseId },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    const assignments: TutorAssignment[] = tutorCourses.map(tc => ({
      id: tc.id,
      tutorId: tc.tutorId,
      courseId: tc.courseId,
      status: tc.status,
      assignedAt: tc.assignedAt,
      assignedBy: tc.assignedBy || undefined,
      tutor: {
        id: tc.tutor.id,
        displayName: tc.tutor.displayName,
        user: tc.tutor.user
      }
    }))

    return { success: true, data: assignments }
  } catch (error) {
    console.error('Error fetching course tutors:', error)
    return { success: false, error: 'Erreur lors de la récupération des tuteurs' }
  }
}

/**
 * Sync course active status based on available active tutors
 * A course is active if it has at least one active tutor with approved status
 */
export async function syncCourseActiveStatus(courseId: string): Promise<void> {
  try {
    // Count active tutors for this course
    // Active tutor = TutorCourse.active = true AND status = 'approved' AND Tutor.active = true
    const activeTutorCount = await prisma.tutorCourse.count({
      where: {
        courseId: courseId,
        active: true,
        status: 'approved',
        tutor: {
          active: true
        }
      }
    })

    // Update course status based on tutor availability
    await prisma.course.update({
      where: { id: courseId },
      data: { active: activeTutorCount > 0 }
    })

    console.log(`Synced course ${courseId}: ${activeTutorCount} active tutors, course active: ${activeTutorCount > 0}`)
  } catch (error) {
    console.error(`Error syncing course active status for course ${courseId}:`, error)
    // Don't throw - this is a background operation
  }
}

/**
 * Assign tutors to a course
 */
export async function assignTutorsToCourse(
  courseId: string,
  tutorIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return { success: false, error: 'Cours non trouvé' }
    }

    // Create assignments
    await prisma.tutorCourse.createMany({
      data: tutorIds.map(tutorId => ({
        tutorId,
        courseId,
        status: 'pending',
        assignedBy: user.id
      })),
      skipDuplicates: true
    })

    // Sync course active status (will check if any tutors are approved)
    await syncCourseActiveStatus(courseId)

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error assigning tutors:', error)
    return { success: false, error: 'Erreur lors de l\'assignation des tuteurs' }
  }
}

/**
 * Update tutor course assignment status
 */
export async function updateTutorCourseStatus(
  tutorCourseId: string,
  status: 'pending' | 'approved' | 'inactive'
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    // Get the courseId before updating
    const tutorCourse = await prisma.tutorCourse.findUnique({
      where: { id: tutorCourseId },
      select: { courseId: true }
    })

    if (!tutorCourse) {
      return { success: false, error: 'Assignation non trouvée' }
    }

    await prisma.tutorCourse.update({
      where: { id: tutorCourseId },
      data: { status }
    })

    // Sync course active status after status change
    await syncCourseActiveStatus(tutorCourse.courseId)

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error updating tutor course status:', error)
    return { success: false, error: 'Erreur lors de la mise à jour du statut' }
  }
}

/**
 * Bulk activate courses
 */
export async function bulkActivateCourses(courseIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    await prisma.course.updateMany({
      where: { id: { in: courseIds } },
      data: { active: true }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error bulk activating courses:', error)
    return { success: false, error: 'Erreur lors de l\'activation des cours' }
  }
}

/**
 * Bulk deactivate courses
 */
export async function bulkDeactivateCourses(courseIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    await prisma.course.updateMany({
      where: { id: { in: courseIds } },
      data: { active: false }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error bulk deactivating courses:', error)
    return { success: false, error: 'Erreur lors de la désactivation des cours' }
  }
}

/**
 * Toggle course active status (individual course)
 */
export async function toggleCourseStatus(courseId: string): Promise<{ success: boolean; error?: string; active?: boolean }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    // Get current status
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { active: true }
    })

    if (!course) {
      return { success: false, error: 'Cours non trouvé' }
    }

    // Toggle status
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { active: !course.active },
      select: { active: true }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, active: updatedCourse.active }
  } catch (error) {
    console.error('Error toggling course status:', error)
    return { success: false, error: 'Erreur lors de la modification du statut du cours' }
  }
}