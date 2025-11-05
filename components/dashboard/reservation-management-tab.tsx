'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDateTime, translateAppointmentStatus } from '@/lib/utils'
import { getStudentAppointments } from '@/lib/actions/reservations'
import { RescheduleModal } from './reschedule-modal'
import { MessageCircle } from 'lucide-react'
import { StudentRatingDialog } from './ratings/student-rating-dialog'
interface ReservationManagementTabProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    role: string
    stripeCustomerId?: string | null
    defaultPaymentMethodId?: string | null
    createdAt: Date
  }
}

export function ReservationManagementTab({ user }: ReservationManagementTabProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

          useEffect(() => {
            async function fetchData() {
              try {
                const appointmentsData = await getStudentAppointments(user.id)
                setAppointments(appointmentsData)
              } catch (error) {
                console.error('Error fetching reservation data:', error)
              } finally {
                setLoading(false)
              }
            }

            fetchData()
          }, [user.id])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestion des réservations</h2>
          <p className="text-muted-foreground">
            Chargement...
          </p>
        </div>
      </div>
    )
  }

          const now = new Date()
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          
          // Filter appointments: future + last month
          const relevantAppointments = appointments.filter((apt) => {
            const aptDate = new Date(apt.startDatetime)
            return aptDate >= oneMonthAgo
          })
          
          // Extract unique course/tutor combinations
          const uniqueCourseTutorCombinations = Array.from(
            new Map(
              relevantAppointments.map((apt) => [
                `${apt.courseId}-${apt.tutorId}`, // Use courseId-tutorId as unique key
                {
                  courseId: apt.courseId,
                  courseSlug: apt.course.slug,
                  courseCode: apt.course.code,
                  tutorId: apt.tutorId,
                  tutorFirstName: apt.tutor.user.firstName,
                },
              ])
            ).values()
          )
          
          const upcomingAppointments = appointments
            .filter((apt) => new Date(apt.startDatetime) > now && apt.status === 'scheduled')
            .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
          const pastAppointments = appointments
            .filter((apt) => new Date(apt.startDatetime) <= now || apt.status !== 'scheduled')
            .sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime())


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestion des réservations</h2>
        <p className="text-muted-foreground">
          Gérez vos rendez-vous
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
          {/* Show buttons for unique course/tutor combinations if any exist */}
          {uniqueCourseTutorCombinations.length > 0 && (
            <>
              {uniqueCourseTutorCombinations.map((combo) => (
                <Button
                  key={`${combo.courseId}-${combo.tutorId}`}
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href={`/cours/${combo.courseSlug}/reservation?tutorId=${combo.tutorId}`}>
                    Réserver d'autres séances de {combo.courseCode} avec {combo.tutorFirstName}
                  </Link>
                </Button>
              ))}
            </>
          )}
          {/* General button - always show */}
          <Button
            asChild
            variant={uniqueCourseTutorCombinations.length > 0 ? "outline" : "default"}
            className="w-full sm:w-auto"
          >
            <Link href="/cours">Réserver du tutorat pour d'autres cours</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Appointments - Main Focus */}
      <Card>
        <CardHeader>
          <CardTitle>Rendez-vous à venir</CardTitle>
          <CardDescription>
            {upcomingAppointments.length} rendez-vous programmés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Aucun rendez-vous à venir
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentManagementCard
                  key={appointment.id}
                  appointment={appointment}
                  isUpcoming={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des rendez-vous</CardTitle>
          <CardDescription>
            Vos rendez-vous passés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastAppointments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Aucun rendez-vous passé
            </div>
          ) : (
            <div className="space-y-4">
              {pastAppointments.slice(0, 5).map((appointment) => (
                <AppointmentManagementCard
                  key={appointment.id}
                  appointment={appointment}
                  isUpcoming={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for appointment cards
function AppointmentManagementCard({ appointment, isUpcoming }: { 
  appointment: any, 
  isUpcoming: boolean 
}) {
  // Handle ISO strings (data is now serialized from server)
  const startDatetime = new Date(appointment.startDatetime)
  
  // Check 2-hour rescheduling policy
  const now = new Date()
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const canRescheduleNow = startDatetime > twoHoursFromNow

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-medium text-base sm:text-lg">
              {appointment.course.titleFr}
            </h3>
            <Badge variant={appointment.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs">
              {translateAppointmentStatus(appointment.status)}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-1">
            Tuteur: {appointment.tutor.user.firstName} {appointment.tutor.user.lastName}
          </p>
          
          <p className="text-sm text-muted-foreground mb-1">
            {formatDateTime(startDatetime)}
          </p>

          {appointment.cancellationReason && (
            <div className="mt-2 p-2 bg-error-light border border-error-border rounded text-sm">
              <p className="text-error">
                <strong>Annulé:</strong> {appointment.cancellationReason}
              </p>
            </div>
          )}

          {appointment.modifications && appointment.modifications.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Modifié {appointment.modifications.length} fois
              </p>
            </div>
          )}
        </div>

        {isUpcoming && appointment.status === 'scheduled' && (
          <div className="flex flex-col gap-2 sm:ml-4 sm:flex-shrink-0">
            {canRescheduleNow ? (
              <RescheduleModal appointment={appointment} />
            ) : (
              <div className="text-xs text-muted-foreground">
                Reprogrammation non disponible
                <br />
                (moins de 2h)
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href={`/tableau-de-bord?tab=messages&tutor=${appointment.tutorId}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Link>
            </Button>
          </div>
        )}
        {!isUpcoming && appointment.status === 'completed' && (
          <div className="sm:ml-4 sm:flex-shrink-0 w-full sm:w-auto">
            <StudentRatingDialog tutorId={appointment.tutorId} courseId={appointment.courseId} appointmentId={appointment.id} />
          </div>
        )}
      </div>
    </div>
  )
}
