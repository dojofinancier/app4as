import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const tutor = await prisma.tutor.findUnique({
    where: { id, active: true },
    include: {
      user: true,
      tutorCourses: {
        where: { active: true },
        include: {
          course: true,
        },
      },
    },
  })

  if (!tutor) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{tutor.displayName}</h1>
        <p className="mt-2 text-muted-foreground">Profil du tuteur</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>À propos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{tutor.bioFr}</p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Cours enseignés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {tutor.tutorCourses.map((tc) => (
                  <Link
                    key={tc.id}
                    href={`/cours/${tc.course.slug}`}
                    className="block"
                  >
                    <div className="rounded-lg border p-4 transition-colors hover:bg-accent">
                      <h3 className="font-semibold">{tc.course.titleFr}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {tc.course.descriptionFr}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Tarification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    60 minutes
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(tutor.hourlyBaseRateCad.toNumber())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    90 minutes
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(tutor.hourlyBaseRateCad.toNumber() * 1.5)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    120 minutes
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(tutor.hourlyBaseRateCad.toNumber() * 2)}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button asChild className="w-full">
                  <Link href="/cours">Réserver une séance</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


