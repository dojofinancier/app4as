import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Clock, User, DollarSign, Users } from 'lucide-react'
import { CourseReservationForm } from '@/components/booking/course-reservation-form'

interface CourseReservationPageProps {
  params: Promise<{ slug: string }>
}

export default async function CourseReservationPage({ params }: CourseReservationPageProps) {
  const { slug } = await params
  
  // Allow both logged-in and guest users
  const user = await getCurrentUser() // This will be null for guests, which is fine
  
  // Fetch course data
  const course = await prisma.course.findUnique({
    where: { slug, active: true },
  })
  
  if (!course) {
    notFound()
  }
  
         // Fetch tutors for this course
         const tutors = await prisma.tutor.findMany({
           where: {
             active: true,
             tutorCourses: {
               some: {
                 courseId: course.id,
                 active: true
               }
             }
           },
           include: {
             user: true
           }
         })

         // Serialize Decimal fields for client components
         const serializedCourse = {
           ...course,
           studentRateCad: Number(course.studentRateCad)
         }

         const serializedTutors = tutors.map(tutor => ({
           ...tutor,
           hourlyBaseRateCad: Number(tutor.hourlyBaseRateCad),
           user: {
             ...tutor.user
           }
         }))
  
  if (tutors.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Aucun tuteur disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aucun tuteur n'est actuellement disponible pour ce cours. 
                Veuillez réessayer plus tard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
               {/* Course Header */}
               <div className="mb-8">
                 <h1 className="text-4xl font-bold mb-4">{serializedCourse.titleFr}</h1>
                 <p className="text-lg text-muted-foreground mb-6">
                   {serializedCourse.descriptionFr}
                 </p>
          
          {/* Course Info */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cours disponible
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Séances de 60, 90 ou 120 minutes
            </Badge>
          </div>
        </div>


               {/* Reservation Form */}
               <CourseReservationForm 
                 course={serializedCourse}
                 tutors={serializedTutors}
                 user={user}
               />
      </div>
    </div>
  )
}