import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { prisma } from '@/lib/prisma'
import { getStudentAppointments } from '@/lib/actions/reservations'
import { autoCompletePastAppointments } from '@/lib/actions/appointments'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'
import { TutorDashboard } from '@/components/dashboard/tutor-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { StripeProvider } from '@/components/payment/stripe-provider'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/connexion')
  }

  // Render different dashboards based on role
  switch (user.role) {
    case 'admin':
      // Serialize user for client components (admin case)
      const serializedAdminUser = {
        ...user,
        tutor: user.tutor ? {
          ...user.tutor,
          hourlyBaseRateCad: Number(user.tutor.hourlyBaseRateCad),
        } : null,
      }
      return <AdminDashboard user={serializedAdminUser} />
    case 'tutor':
      // Check if user has a tutor profile first
      const tutorProfile = await prisma.tutor.findUnique({
        where: { id: user.id },
        include: {
          user: true,
          tutorCourses: {
            include: {
              course: true,
            },
          },
        },
      })

      if (!tutorProfile) {
        // If no tutor profile exists, show setup instructions
        return (
          <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">Profil tuteur en cours de configuration</h1>
              <p className="text-muted-foreground mb-6">
                Votre compte tuteur a été créé mais le profil professionnel n'est pas encore configuré. 
                L'administrateur doit finaliser la configuration de votre profil.
              </p>
              <div className="bg-info-light border border-info-border rounded-lg p-4 mb-6">
                <h3 className="font-medium text-info mb-2">Prochaines étapes :</h3>
                <ul className="text-sm text-info text-left space-y-1">
                  <li>• L'administrateur va créer votre profil tuteur</li>
                  <li>• Vos disponibilités seront configurées</li>
                  <li>• Vous serez assigné aux cours appropriés</li>
                  <li>• Vous recevrez un email de confirmation</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="/connexion" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Retour à la connexion
                </a>
                <RefreshButton />
              </div>
            </div>
          </div>
        )
      }

      // Fetch remaining tutor data with error handling
      let tutorAppointments: any[] = []

      try {
        // Auto-complete past appointments first
        await autoCompletePastAppointments()

        const appointments = await prisma.appointment.findMany({
          where: { tutorId: user.id },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            course: {
              select: {
                id: true,
                titleFr: true,
                slug: true,
                descriptionFr: true,
                active: true,
                createdAt: true,
                studentRateCad: true,
              },
            },
            orderItem: {
              select: {
                unitPriceCad: true,
                lineTotalCad: true,
              },
            },
          },
          orderBy: { startDatetime: 'asc' },
        })

        tutorAppointments = appointments || []
      } catch (error) {
        console.error('Error fetching tutor data:', error)
        // Continue with empty data rather than crashing
      }

      // Serialize tutor profile for client components
      const serializedTutorProfile = {
        ...tutorProfile,
        hourlyBaseRateCad: Number(tutorProfile.hourlyBaseRateCad),
        tutorCourses: tutorProfile.tutorCourses.map(tc => ({
          ...tc,
          course: {
            ...tc.course,
            studentRateCad: Number(tc.course.studentRateCad),
          }
        }))
      }

      // Serialize appointments for client components
      const serializedTutorAppointments = tutorAppointments.map(apt => ({
        ...apt,
        createdAt: new Date(),
        updatedAt: new Date(),
        course: {
          ...apt.course,
          studentRateCad: Number(apt.course.studentRateCad),
        },
        orderItem: apt.orderItem ? {
          ...apt.orderItem,
          unitPriceCad: Number(apt.orderItem.unitPriceCad),
          lineTotalCad: Number(apt.orderItem.lineTotalCad),
        } : null
      }))

      return (
        <TutorDashboard
          tutorId={user.id}
          tutorName={tutorProfile.displayName}
          tutorProfile={serializedTutorProfile}
          appointments={serializedTutorAppointments}
        />
      )
    default:
      // Get student's appointments and orders
      const [appointments, orders] = await Promise.all([
        getStudentAppointments(user.id),
        prisma.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ])

      // Serialize orders for client components
      const serializedOrders = orders.map(order => ({
        ...order,
        totalCad: Number(order.totalCad),
        subtotalCad: Number(order.subtotalCad),
        discountCad: Number(order.discountCad),
      }))

      // Serialize appointments (convert Prisma Decimal and ensure plain objects)
      const serializedAppointments = appointments.map(apt => ({
        ...apt,
        course: apt.course ? {
          ...apt.course,
          studentRateCad: Number((apt.course as any).studentRateCad ?? 0),
        } : null,
        tutor: apt.tutor ? {
          ...apt.tutor,
          hourlyBaseRateCad: Number((apt.tutor as any).hourlyBaseRateCad ?? 0),
        } : null,
        orderItem: apt.orderItem ? {
          ...apt.orderItem,
          unitPriceCad: Number((apt.orderItem as any).unitPriceCad ?? 0),
          lineTotalCad: Number((apt.orderItem as any).lineTotalCad ?? 0),
          tutorEarningsCad: apt.orderItem && (apt.orderItem as any).tutorEarningsCad != null ? Number((apt.orderItem as any).tutorEarningsCad) : null,
          hoursWorked: apt.orderItem && (apt.orderItem as any).hoursWorked != null ? Number((apt.orderItem as any).hoursWorked) : null,
          rateAtTime: apt.orderItem && (apt.orderItem as any).rateAtTime != null ? Number((apt.orderItem as any).rateAtTime) : null,
        } : null,
      }))

      // Serialize user for client components
      const serializedUser = {
        ...user,
      }

      return (
        <StripeProvider>
          <StudentDashboard
            user={serializedUser}
            appointments={serializedAppointments as any}
            orders={serializedOrders}
          />
        </StripeProvider>
      )
  }
}

