import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { frCA } from '@/lib/i18n/fr-CA'

export default async function TutorsPage() {
  const tutors = await prisma.tutor.findMany({
    where: { active: true },
    include: {
      tutorCourses: {
        where: { active: true },
        include: {
          course: true,
        },
      },
    },
    orderBy: { priority: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{frCA.tutors.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Découvrez notre équipe de tuteurs qualifiés
        </p>
      </div>

      {tutors.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{frCA.tutors.noTutors}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor) => (
            <Card key={tutor.id}>
              <CardHeader>
                <CardTitle>{tutor.displayName}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {tutor.bioFr}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm font-medium">{frCA.tutors.courseTaught}:</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tutor.tutorCourses.map((tc) => (
                      <span
                        key={tc.id}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {tc.course.titleFr}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {frCA.tutors.hourlyRate}:{' '}
                  <span className="font-semibold text-primary">
                    {formatCurrency(tutor.hourlyBaseRateCad.toNumber())}
                  </span>
                  /h
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/tuteurs/${tutor.id}`}>
                    {frCA.tutors.viewProfile}
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


