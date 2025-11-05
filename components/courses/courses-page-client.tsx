'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CourseSearch } from './course-search'
import { frCA } from '@/lib/i18n/fr-CA'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

interface Course {
  id: string
  slug: string
  code: string
  titleFr: string
  institution?: string
}

interface CoursesPageClientProps {
  courses: Course[]
}

export function CoursesPageClient({ courses }: CoursesPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) {
      return courses
    }

    const term = searchTerm.toLowerCase()
    return courses.filter(course => 
      course.code.toLowerCase().includes(term) ||
      course.titleFr.toLowerCase().includes(term) ||
      (course.institution && course.institution.toLowerCase().includes(term))
    )
  }, [courses, searchTerm])

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{frCA.courses.noCourses}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="max-w-2xl">
        <CourseSearch
          courses={courses}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {filteredCourses.length} cours trouvé{filteredCourses.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Aucun cours trouvé pour "{searchTerm}"
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="flex-grow">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {course.titleFr}
                    </CardTitle>
                    <div className="space-y-1 text-sm">
                      <div className="font-mono text-muted-foreground">
                        {course.code}
                      </div>
                      {course.institution && (
                        <div className="text-muted-foreground">
                          {course.institution}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/cours/${course.slug}`}>
                    {frCA.courses.viewCourse}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
