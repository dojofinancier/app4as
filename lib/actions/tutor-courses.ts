'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'

export interface TutorCourseData {
  id: string
  courseId: string
  status: string
  assignedAt: Date
  course: {
    id: string
    code: string
    titleFr: string
    descriptionFr: string
    institution?: string
    domain?: string
    studentRateCad: number
    active: boolean
  }
}

export interface CourseRequestData {
  id: string
  courseId: string
  status: string
  message?: string
  requestedAt: Date
  reviewedAt?: Date
  adminNote?: string
  course: {
    id: string
    code: string
    titleFr: string
    descriptionFr: string
    institution?: string
    domain?: string
    studentRateCad: number
    active: boolean
  }
}

export interface AvailableCourseData {
  id: string
  code: string
  titleFr: string
  descriptionFr: string
  institution?: string
  domain?: string
  studentRateCad: number
  active: boolean
  _count: {
    tutorCourses: number
    appointments: number
  }
}

/**
 * Get courses currently assigned to a tutor
 */
export async function getTutorCourses(tutorId: string): Promise<{ success: boolean; data?: TutorCourseData[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'tutor') {
      return { success: false, error: 'Accès tuteur requis' }
    }

    const tutorCourses = await prisma.tutorCourse.findMany({
      where: { tutorId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            titleFr: true,
            descriptionFr: true,
            institution: true,
            domain: true,
            studentRateCad: true,
            active: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    const formattedCourses: TutorCourseData[] = tutorCourses.map(tc => ({
      id: tc.id,
      courseId: tc.courseId,
      status: tc.status,
      assignedAt: tc.assignedAt,
      course: {
        id: tc.course.id,
        code: tc.course.code,
        titleFr: tc.course.titleFr,
        descriptionFr: tc.course.descriptionFr,
        institution: tc.course.institution || undefined,
        domain: tc.course.domain || undefined,
        studentRateCad: Number(tc.course.studentRateCad),
        active: tc.course.active
      }
    }))

    return { success: true, data: formattedCourses }
  } catch (error) {
    console.error('Error fetching tutor courses:', error)
    return { success: false, error: 'Erreur lors de la récupération des cours' }
  }
}

/**
 * Get courses available for a tutor to request (not yet assigned)
 */
export async function getAvailableCoursesForTutor(tutorId: string): Promise<{ success: boolean; data?: AvailableCourseData[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'tutor') {
      return { success: false, error: 'Accès tuteur requis' }
    }

    // Get courses that are not assigned to this tutor
    const courses = await prisma.course.findMany({
      where: {
        active: true,
        tutorCourses: {
          none: {
            tutorId: tutorId
          }
        }
      },
      include: {
        _count: {
          select: {
            tutorCourses: true,
            appointments: true
          }
        }
      },
      orderBy: {
        titleFr: 'asc'
      }
    })

    const formattedCourses: AvailableCourseData[] = courses.map(course => ({
      id: course.id,
      code: course.code,
      titleFr: course.titleFr,
      descriptionFr: course.descriptionFr,
      institution: course.institution || undefined,
      domain: course.domain || undefined,
      studentRateCad: Number(course.studentRateCad),
      active: course.active,
      _count: course._count
    }))

    return { success: true, data: formattedCourses }
  } catch (error) {
    console.error('Error fetching available courses:', error)
    return { success: false, error: 'Erreur lors de la récupération des cours disponibles' }
  }
}

/**
 * Get tutor's course requests
 */
export async function getTutorCourseRequests(tutorId: string): Promise<{ success: boolean; data?: CourseRequestData[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'tutor') {
      return { success: false, error: 'Accès tuteur requis' }
    }

    const requests = await prisma.tutorCourseRequest.findMany({
      where: { tutorId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            titleFr: true,
            descriptionFr: true,
            institution: true,
            domain: true,
            studentRateCad: true,
            active: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    const formattedRequests: CourseRequestData[] = requests.map(req => ({
      id: req.id,
      courseId: req.courseId,
      status: req.status,
      message: req.message || undefined,
      requestedAt: req.requestedAt,
      reviewedAt: req.reviewedAt || undefined,
      adminNote: req.adminNote || undefined,
      course: {
        id: req.course.id,
        code: req.course.code,
        titleFr: req.course.titleFr,
        descriptionFr: req.course.descriptionFr,
        institution: req.course.institution || undefined,
        domain: req.course.domain || undefined,
        studentRateCad: Number(req.course.studentRateCad),
        active: req.course.active
      }
    }))

    return { success: true, data: formattedRequests }
  } catch (error) {
    console.error('Error fetching course requests:', error)
    return { success: false, error: 'Erreur lors de la récupération des demandes' }
  }
}

/**
 * Request to teach a course
 */
export async function requestCourseAssignment(courseId: string, message?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'tutor') {
      return { success: false, error: 'Accès tuteur requis' }
    }

    // Get tutor ID
    const tutor = await prisma.tutor.findUnique({
      where: { id: user.id }
    })

    if (!tutor) {
      return { success: false, error: 'Profil tuteur non trouvé' }
    }

    // Check if course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course || !course.active) {
      return { success: false, error: 'Cours non trouvé ou inactif' }
    }

    // Check if already assigned
    const existingAssignment = await prisma.tutorCourse.findUnique({
      where: {
        tutorId_courseId: {
          tutorId: user.id,
          courseId: courseId
        }
      }
    })

    if (existingAssignment) {
      return { success: false, error: 'Vous êtes déjà assigné à ce cours' }
    }

    // Check if already requested
    const existingRequest = await prisma.tutorCourseRequest.findUnique({
      where: {
        tutorId_courseId: {
          tutorId: user.id,
          courseId: courseId
        }
      }
    })

    if (existingRequest) {
      return { success: false, error: 'Vous avez déjà demandé ce cours' }
    }

    // Create request
    await prisma.tutorCourseRequest.create({
      data: {
        tutorId: user.id,
        courseId: courseId,
        message: message || null
      }
    })

    revalidatePath('/tuteur/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error requesting course assignment:', error)
    return { success: false, error: 'Erreur lors de la demande de cours' }
  }
}

/**
 * Cancel a course request
 */
export async function cancelCourseRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'tutor') {
      return { success: false, error: 'Accès tuteur requis' }
    }

    // Check if request exists and belongs to this tutor
    const request = await prisma.tutorCourseRequest.findFirst({
      where: {
        id: requestId,
        tutorId: user.id,
        status: 'pending'
      }
    })

    if (!request) {
      return { success: false, error: 'Demande non trouvée ou déjà traitée' }
    }

    // Delete the request
    await prisma.tutorCourseRequest.delete({
      where: { id: requestId }
    })

    revalidatePath('/tuteur/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error canceling course request:', error)
    return { success: false, error: 'Erreur lors de l\'annulation de la demande' }
  }
}

/**
 * Get all course requests (admin only)
 */
export async function getAllCourseRequests(filters?: {
  status?: 'all' | 'pending' | 'approved' | 'rejected'
  search?: string
}): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    const where: any = {}
    
    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status
    }
    
    if (filters?.search) {
      where.OR = [
        { course: { titleFr: { contains: filters.search, mode: 'insensitive' } } },
        { course: { code: { contains: filters.search, mode: 'insensitive' } } },
        { tutor: { displayName: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }

    const requests = await prisma.tutorCourseRequest.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            titleFr: true,
            descriptionFr: true,
            institution: true,
            domain: true,
            studentRateCad: true,
            active: true
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
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    return { success: true, data: requests }
  } catch (error) {
    console.error('Error fetching course requests:', error)
    return { success: false, error: 'Erreur lors de la récupération des demandes' }
  }
}

/**
 * Approve a course request (admin only)
 */
export async function approveCourseRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    // Get the request
    const request = await prisma.tutorCourseRequest.findUnique({
      where: { id: requestId },
      include: {
        course: true,
        tutor: true
      }
    })

    if (!request) {
      return { success: false, error: 'Demande non trouvée' }
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Cette demande a déjà été traitée' }
    }

    // Use transaction to update request and create assignment
    await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.tutorCourseRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: user.id
        }
      })

      // Create tutor course assignment
      await tx.tutorCourse.create({
        data: {
          tutorId: request.tutorId,
          courseId: request.courseId,
          status: 'approved',
          assignedBy: user.id
        }
      })
    })

    // Sync course active status after approving request
    const { syncCourseActiveStatus } = await import('@/lib/actions/course-management')
    await syncCourseActiveStatus(request.courseId)

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error approving course request:', error)
    return { success: false, error: 'Erreur lors de l\'approbation de la demande' }
  }
}

/**
 * Reject a course request (admin only)
 */
export async function rejectCourseRequest(requestId: string, adminNote?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Accès administrateur requis' }
    }

    // Update request status
    await prisma.tutorCourseRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: user.id,
        adminNote: adminNote || null
      }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error rejecting course request:', error)
    return { success: false, error: 'Erreur lors du rejet de la demande' }
  }
}
