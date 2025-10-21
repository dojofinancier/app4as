'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getStudentAppointments, getStudentCreditBalance, getStudentCreditTransactions } from '@/lib/actions/reservations'
import { CancellationModal } from './cancellation-modal'
import { RescheduleModal } from './reschedule-modal'
import { CreditBankCard } from './credit-bank-card'
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
    creditBalance: number
    createdAt: Date
  }
}

export function ReservationManagementTab({ user }: ReservationManagementTabProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [creditBalance, setCreditBalance] = useState<number>(0)
  const [creditTransactions, setCreditTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

          useEffect(() => {
            async function fetchData() {
              try {
                const [appointmentsData, creditBalanceData, creditTransactionsData] = await Promise.all([
                  getStudentAppointments(user.id),
                  getStudentCreditBalance(user.id),
                  getStudentCreditTransactions(user.id)
                ])

                setAppointments(appointmentsData)
                setCreditBalance(creditBalanceData)
                setCreditTransactions(creditTransactionsData)
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
          const upcomingAppointments = appointments.filter(
            (apt) => new Date(apt.startDatetime) > now && apt.status === 'scheduled'
          )
          const pastAppointments = appointments.filter(
            (apt) => new Date(apt.startDatetime) <= now || apt.status !== 'scheduled'
          )

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

      {/* Credit Bank - Small Secondary Card */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Banque d'heures</CardTitle>
            <CardDescription>
              Vos crédits de tutorat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {formatCurrency(creditBalance)}
              </div>
              <p className="text-sm text-muted-foreground">
                Disponible pour de nouveaux cours
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Credit Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activité récente</CardTitle>
            <CardDescription>
              Dernières transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {creditTransactions.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground text-sm">
                Aucune transaction
              </div>
            ) : (
              <div className="space-y-2">
                {creditTransactions.slice(0, 3).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          transaction.type === 'earned' 
                            ? 'default' 
                            : transaction.type === 'used' 
                            ? 'secondary' 
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {transaction.type === 'earned' && 'Crédit'}
                        {transaction.type === 'used' && 'Utilisé'}
                        {transaction.type === 'refunded' && 'Remboursé'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(transaction.createdAt)}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${
                      transaction.type === 'earned' 
                        ? 'text-green-600' 
                        : transaction.type === 'used' 
                        ? 'text-blue-600' 
                        : 'text-gray-600'
                    }`}>
                      {transaction.type === 'earned' ? '+' : transaction.type === 'used' ? '-' : ''}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper component for appointment cards
function AppointmentManagementCard({ appointment, isUpcoming }: { 
  appointment: any, 
  isUpcoming: boolean 
}) {
  const canCancel = isUpcoming && appointment.status === 'scheduled'
  const canReschedule = isUpcoming && appointment.status === 'scheduled'
  
  // Handle ISO strings (data is now serialized from server)
  const startDatetime = new Date(appointment.startDatetime)
  
  // Check 2-hour cancellation policy
  const now = new Date()
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const canCancelNow = startDatetime > twoHoursFromNow
  
  // Check 24-hour rescheduling policy
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const canRescheduleNow = startDatetime > twentyFourHoursFromNow

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
          
          <p className="text-sm font-medium">
            {appointment.orderItem ? formatCurrency(appointment.orderItem.lineTotalCad) : 'Prix non disponible'}
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
          <div className="flex gap-2 ml-4">
            {canRescheduleNow ? (
              <RescheduleModal appointment={appointment} />
            ) : (
              <div className="text-xs text-muted-foreground">
                Reprogrammation non disponible
                <br />
                (moins de 24h)
              </div>
            )}
            
            {canCancelNow ? (
              <CancellationModal appointment={appointment} />
            ) : (
              <div className="text-xs text-muted-foreground">
                Annulation non disponible
                <br />
                (moins de 2h)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
