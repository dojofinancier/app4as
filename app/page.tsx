import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { frCA } from '@/lib/i18n/fr-CA'
import { CACHE_TTL, CACHE_TAGS } from '@/lib/utils/cache'
import { CoursesPageClient } from '@/components/courses/courses-page-client'

// Cached function to fetch active courses with available tutors (1 hour TTL)
const getCachedCoursesWithTutors = unstable_cache(
  async () => {
    return await prisma.course.findMany({
      where: {
        active: true,
        // Only courses that have at least one active tutor assigned
        tutorCourses: {
          some: {
            active: true,
            tutor: {
              active: true
            }
          }
        }
      },
      orderBy: { titleFr: 'asc' },
      select: {
        id: true,
        slug: true,
        code: true,
        titleFr: true,
        institution: true,
      },
    })
  },
  ['active-courses-with-tutors'],
  {
    revalidate: CACHE_TTL.COURSES,
    tags: [CACHE_TAGS.COURSES],
  }
)

export default async function HomePage() {
  const courses = await getCachedCoursesWithTutors()

  // Transform courses to match component interface (convert null to undefined)
  const transformedCourses = courses.map(course => ({
    ...course,
    institution: course.institution ?? undefined,
  }))

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{frCA.courses.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Sélectionnez un cours pour voir les disponibilités et réserver
        </p>
      </div>

      <CoursesPageClient courses={transformedCourses} />
    </div>
  )
}


