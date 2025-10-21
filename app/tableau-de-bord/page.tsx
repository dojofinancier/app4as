import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { prisma } from '@/lib/prisma'
import { getStudentAppointments } from '@/lib/actions/reservations'
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
      return <AdminDashboard user={user} />
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Prochaines étapes :</h3>
                <ul className="text-sm text-blue-800 text-left space-y-1">
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
      let tutorAvailability: { rules: any[]; exceptions: any[]; timeOffs: any[] } = { rules: [], exceptions: [], timeOffs: [] }

      try {
        const [appointments, availabilityData] = await Promise.all([
          // Get tutor appointments
          prisma.appointment.findMany({
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
          }),
          // Get tutor availability
          Promise.all([
            prisma.availabilityRule.findMany({
              where: { tutorId: user.id },
              orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
            }),
            prisma.availabilityException.findMany({
              where: { tutorId: user.id },
              orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
            }),
            prisma.timeOff.findMany({
              where: { tutorId: user.id },
              orderBy: { startDatetime: 'asc' },
            }),
          ]).then(([rules, exceptions, timeOffs]) => ({
            rules: rules || [],
            exceptions: exceptions || [],
            timeOffs: timeOffs || [],
          })),
        ])

        tutorAppointments = appointments || []
        tutorAvailability = availabilityData || { rules: [], exceptions: [], timeOffs: [] }
      } catch (error) {
        console.error('Error fetching tutor data:', error)
        // Continue with empty data rather than crashing
      }

      return (
        <TutorDashboard
          user={user}
          tutorProfile={tutorProfile}
          appointments={tutorAppointments}
          availability={tutorAvailability}
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

      return (
        <StripeProvider>
          <StudentDashboard
            user={user}
            appointments={appointments}
            orders={orders}
          />
        </StripeProvider>
      )
  }
}

