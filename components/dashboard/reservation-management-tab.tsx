'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
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
          const upcomingAppointments = appointments
            .filter((apt) => new Date(apt.startDatetime) > now && apt.status === 'scheduled')
            .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
          const pastAppointments = appointments
            .filter((apt) => new Date(apt.startDatetime) <= now || apt.status !== 'scheduled')
            .sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime())


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestion des réservations</h2>
          <p className="text-muted-foreground">
            Gérez vos rendez-vous
          </p>
        </div>
        <Button asChild>
          <Link href="/cours">Réserver plus de séances</Link>
        </Button>
      </div>

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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium">
              {appointment.course.titleFr}
            </h3>
            <Badge variant={appointment.status === 'scheduled' ? 'default' : 'secondary'}>
              {appointment.status === 'scheduled' ? 'Programmé' : 
               appointment.status === 'cancelled' ? 'Annulé' : 
               appointment.status === 'completed' ? 'Terminé' : appointment.status}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-1">
            Tuteur: {appointment.tutor.user.firstName} {appointment.tutor.user.lastName}
          </p>
          
          <p className="text-sm text-muted-foreground mb-1">
            {formatDateTime(startDatetime)}
          </p>

          {appointment.cancellationReason && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
              <p className="text-red-800">
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
          <div className="flex flex-col gap-2 ml-4">
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
            >
              <Link href={`/tableau-de-bord?tab=messages&tutor=${appointment.tutorId}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Link>
            </Button>
          </div>
        )}
        {!isUpcoming && appointment.status === 'completed' && (
          <div className="ml-4">
            <StudentRatingDialog tutorId={appointment.tutorId} courseId={appointment.courseId} appointmentId={appointment.id} />
          </div>
        )}
      </div>
    </div>
  )
}
