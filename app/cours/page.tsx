import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { frCA } from '@/lib/i18n/fr-CA'

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { active: true },
    orderBy: { titleFr: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{frCA.courses.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Sélectionnez un cours pour voir les disponibilités et réserver
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{frCA.courses.noCourses}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.titleFr}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {course.descriptionFr}
                </CardDescription>
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


