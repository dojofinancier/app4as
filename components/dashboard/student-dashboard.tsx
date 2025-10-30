'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { frCA } from '@/lib/i18n/fr-CA'
import { AppointmentCard } from './appointment-card'
import { ProfileManagementTab } from './profile-management-tab'
import { ReservationManagementTab } from './reservation-management-tab'
import { MessagingTab } from '../messaging/messaging-tab'
import { SupportTicketsTab } from './support-tickets-tab'
import { Calendar, User as UserIcon, Settings, BookOpen, MessageCircle, HelpCircle } from 'lucide-react'
import type { Appointment, Course, Tutor, User, Order } from '@prisma/client'

interface StudentDashboardProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    role: string
    stripeCustomerId: string | null
    defaultPaymentMethodId: string | null
    createdAt: Date
  }
  appointments: Array<{
    id: string
    userId: string
    tutorId: string
    courseId: string
    startDatetime: Date
    endDatetime: Date
    status: string
    createdAt: Date
    updatedAt: Date
    course: {
      id: string
      slug: string
      titleFr: string
      descriptionFr: string
      active: boolean
      createdAt: Date
      studentRateCad: number
    }
    tutor: {
      id: string
      displayName: string
      bioFr: string
      hourlyBaseRateCad: number
      priority: number
      active: boolean
      user: {
        id: string
        firstName: string
        lastName: string
        email: string
        phone: string | null
        role: string
      }
    }
  }>
  orders: Array<{
    id: string
    userId: string
    subtotalCad: number
    discountCad: number
    totalCad: number
    currency: string
    stripePaymentIntentId: string | null
    stripeCheckoutSessionId: string | null
    status: string
    createdAt: Date
  }>
}

export function StudentDashboard({
  user,
  appointments: initialAppointments,
  orders,
}: StudentDashboardProps) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'reservations' | 'messages' | 'tickets'>('overview')
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null)
  const [selectedTutorInfo, setSelectedTutorInfo] = useState<any>(null)
  const [appointments, setAppointments] = useState(initialAppointments)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Function to refresh appointments
  const refreshAppointments = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/debug/appointments-detailed?email=' + encodeURIComponent(user.email))
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error('Error refreshing appointments:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab')
    const tutor = searchParams.get('tutor')
    
    if (tab === 'messages') {
      setActiveTab('messages')
    }
    
    if (tutor) {
      setSelectedTutorId(tutor)
      // Find tutor info from appointments
      const appointment = appointments.find(apt => apt.tutorId === tutor)
      if (appointment) {
        setSelectedTutorInfo({
          id: appointment.tutorId,
          firstName: appointment.tutor.user.firstName,
          lastName: appointment.tutor.user.lastName,
          role: 'tutor'
        })
      }
    }
  }, [searchParams])
  
  const now = new Date()
  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.startDatetime) > now && apt.status === 'scheduled')
    .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
  const pastAppointments = appointments
    .filter((apt) => new Date(apt.startDatetime) <= now || apt.status !== 'scheduled')
    .sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime())


  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          {frCA.dashboard.student.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Bienvenue, {user.firstName} {user.lastName}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Vue d'ensemble
        </Button>
        <Button
          variant={activeTab === 'reservations' ? 'default' : 'outline'}
          onClick={() => setActiveTab('reservations')}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Mes réservations
        </Button>
        <Button
          variant={activeTab === 'profile' ? 'default' : 'outline'}
          onClick={() => setActiveTab('profile')}
        >
          <UserIcon className="h-4 w-4 mr-2" />
          Mon profil
        </Button>
        <Button
          variant={activeTab === 'messages' ? 'default' : 'outline'}
          onClick={() => setActiveTab('messages')}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Messages
        </Button>
        <Button
          variant={activeTab === 'tickets' ? 'default' : 'outline'}
          onClick={() => setActiveTab('tickets')}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Support
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Upcoming Appointments */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{frCA.dashboard.student.upcomingAppointments}</CardTitle>
                  <CardDescription>
                    {upcomingAppointments.length} rendez-vous à venir
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAppointments}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {frCA.dashboard.student.noAppointments}
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Appointments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{frCA.dashboard.student.pastAppointments}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAppointments}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pastAppointments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucun rendez-vous passé
                </div>
              ) : (
                <div className="space-y-4">
                  {pastAppointments.slice(0, 5).map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      isPast
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {/* Quick Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/cours">Réserver plus de séances</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/panier">Voir le panier</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>{frCA.dashboard.student.myOrders}</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune commande
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">
                          Commande #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-primary">
                          {formatCurrency(order.totalCad)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </p>
                      <div className="mt-1">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                            order.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : order.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <ReservationManagementTab user={{
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          stripeCustomerId: user.stripeCustomerId,
          defaultPaymentMethodId: user.defaultPaymentMethodId,
          createdAt: user.createdAt
        }} />
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <ProfileManagementTab user={user} />
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <MessagingTab selectedTutorInfo={selectedTutorInfo} />
      )}

      {/* Support Tickets Tab */}
      {activeTab === 'tickets' && (
        <SupportTicketsTab userId={user.id} />
      )}
    </div>
  )
}


