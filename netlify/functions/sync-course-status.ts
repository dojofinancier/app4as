import { Handler } from '@netlify/functions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Netlify Scheduled Function: Sync Course Active Status
 * 
 * Purpose: Ensure all courses have correct active status based on tutor availability
 * Schedule: Hourly (runs every hour to catch edge cases)
 * 
 * This function:
 * - Checks all courses
 * - Counts active tutors (active tutor with approved status)
 * - Updates course.active to true if at least 1 active tutor, false otherwise
 * 
 * Configuration in netlify.toml:
 * [[schedule]]
 * cron = "0 * * * *"  # Every hour at minute 0
 * function = "sync-course-status"
 */

/**
 * Sync a single course's active status
 */
async function syncCourseStatus(courseId: string): Promise<{ courseId: string; wasActive: boolean; isActive: boolean; activeTutorCount: number }> {
  // Get current course status
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { active: true }
  })

  if (!course) {
    throw new Error(`Course ${courseId} not found`)
  }

  const wasActive = course.active

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

  const isActive = activeTutorCount > 0

  // Update course status if it changed
  if (wasActive !== isActive) {
    await prisma.course.update({
      where: { id: courseId },
      data: { active: isActive }
    })
  }

  return {
    courseId,
    wasActive,
    isActive,
    activeTutorCount
  }
}

export const handler: Handler = async (event, _context) => {
  // Only allow scheduled execution (not manual triggers)
  if ((event as any).source !== 'netlify-scheduled') {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'This function can only be triggered by scheduled events' }),
    }
  }

  const startTime = Date.now()
  const results: Array<{
    courseId: string
    code?: string
    titleFr?: string
    wasActive: boolean
    isActive: boolean
    activeTutorCount: number
    changed: boolean
  }> = []

  try {
    console.log('Starting course status sync...')

    // Get all courses
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        titleFr: true,
        active: true
      }
    })

    console.log(`Found ${courses.length} courses to sync`)

    // Sync each course
    for (const course of courses) {
      try {
        const result = await syncCourseStatus(course.id)
        results.push({
          courseId: result.courseId,
          code: course.code,
          titleFr: course.titleFr,
          wasActive: result.wasActive,
          isActive: result.isActive,
          activeTutorCount: result.activeTutorCount,
          changed: result.wasActive !== result.isActive
        })
      } catch (error) {
        console.error(`Error syncing course ${course.id} (${course.code}):`, error)
        results.push({
          courseId: course.id,
          code: course.code,
          titleFr: course.titleFr,
          wasActive: course.active,
          isActive: course.active,
          activeTutorCount: 0,
          changed: false
        })
      }
    }

    const duration = Date.now() - startTime
    const changedCount = results.filter(r => r.changed).length
    const activatedCount = results.filter(r => r.changed && r.isActive).length
    const deactivatedCount = results.filter(r => r.changed && !r.isActive).length

    console.log(`Course status sync completed in ${duration}ms`)
    console.log(`- ${results.length} courses processed`)
    console.log(`- ${changedCount} courses changed status`)
    console.log(`- ${activatedCount} courses activated`)
    console.log(`- ${deactivatedCount} courses deactivated`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        summary: {
          totalCourses: results.length,
          changedCourses: changedCount,
          activatedCourses: activatedCount,
          deactivatedCourses: deactivatedCount,
          durationMs: duration
        },
        courses: results.filter(r => r.changed) // Only return courses that changed
      }),
    }
  } catch (error) {
    console.error('Error in course status sync:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to sync course status',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  } finally {
    await prisma.$disconnect()
  }
}

