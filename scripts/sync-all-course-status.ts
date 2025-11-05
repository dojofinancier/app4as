/**
 * One-time script to sync all course active statuses
 * 
 * This script will:
 * - Check all courses in the database
 * - Count active tutors for each course
 * - Update course.active to true if at least 1 active tutor, false otherwise
 * 
 * Run with: npx tsx scripts/sync-all-course-status.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncCourseStatus(courseId: string) {
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

  // Get current course status
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { active: true, code: true, titleFr: true }
  })

  if (!course) {
    throw new Error(`Course ${courseId} not found`)
  }

  const shouldBeActive = activeTutorCount > 0
  const changed = course.active !== shouldBeActive

  // Update course status if it needs to change
  if (changed) {
    await prisma.course.update({
      where: { id: courseId },
      data: { active: shouldBeActive }
    })
  }

  return {
    courseId,
    code: course.code,
    titleFr: course.titleFr,
    wasActive: course.active,
    isActive: shouldBeActive,
    activeTutorCount,
    changed
  }
}

async function main() {
  console.log('Starting course status sync...\n')

  try {
    // Get all courses
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        titleFr: true,
        active: true
      },
      orderBy: {
        code: 'asc'
      }
    })

    console.log(`Found ${courses.length} courses to sync\n`)

    const results: Array<{
      courseId: string
      code: string
      titleFr: string
      wasActive: boolean
      isActive: boolean
      activeTutorCount: number
      changed: boolean
    }> = []

    // Sync each course
    for (const course of courses) {
      try {
        const result = await syncCourseStatus(course.id)
        results.push(result)

        if (result.changed) {
          const action = result.isActive ? 'ACTIVATED' : 'DEACTIVATED'
          console.log(`✓ ${result.code} (${result.titleFr}): ${action} - ${result.activeTutorCount} active tutor(s)`)
        } else {
          console.log(`  ${result.code} (${result.titleFr}): No change - ${result.activeTutorCount} active tutor(s), status: ${result.isActive ? 'ACTIVE' : 'INACTIVE'}`)
        }
      } catch (error) {
        console.error(`✗ Error syncing course ${course.code}:`, error)
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

    // Summary
    const changedCount = results.filter(r => r.changed).length
    const activatedCount = results.filter(r => r.changed && r.isActive).length
    const deactivatedCount = results.filter(r => r.changed && !r.isActive).length
    const activeCourses = results.filter(r => r.isActive).length
    const inactiveCourses = results.filter(r => !r.isActive).length

    console.log('\n' + '='.repeat(60))
    console.log('SYNC SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total courses processed: ${results.length}`)
    console.log(`Courses changed: ${changedCount}`)
    console.log(`  → Activated: ${activatedCount}`)
    console.log(`  → Deactivated: ${deactivatedCount}`)
    console.log(`Current status:`)
    console.log(`  → Active courses: ${activeCourses}`)
    console.log(`  → Inactive courses: ${inactiveCourses}`)
    console.log('='.repeat(60))

    if (changedCount > 0) {
      console.log('\nChanged courses:')
      results
        .filter(r => r.changed)
        .forEach(r => {
          console.log(`  - ${r.code}: ${r.wasActive ? 'ACTIVE' : 'INACTIVE'} → ${r.isActive ? 'ACTIVE' : 'INACTIVE'} (${r.activeTutorCount} tutor(s))`)
        })
    }

    console.log('\n✓ Sync completed successfully!')
  } catch (error) {
    console.error('Error during sync:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

