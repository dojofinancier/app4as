'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDateTime, translateOrderStatus } from '@/lib/utils'
import { frCA } from '@/lib/i18n/fr-CA'
import { AppointmentCard } from './appointment-card'
import { ProfileManagementTab } from './profile-management-tab'
import { ReservationManagementTab } from './reservation-management-tab'
import { MessagingTab } from '../messaging/messaging-tab'
import { SupportTicketsTab } from './support-tickets-tab'
import { Calendar, User as UserIcon, BookOpen, MessageCircle, HelpCircle, Menu } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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
      code: string
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
  const [_selectedTutorId, setSelectedTutorId] = useState<string | null>(null)
  const [selectedTutorInfo, setSelectedTutorInfo] = useState<any>(null)
  const [appointments, _setAppointments] = useState(initialAppointments)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Function to refresh appointments
  // Note: Refresh functionality removed - appointments are loaded server-side
  // To refresh, user can reload the page
  const refreshAppointments = async () => {
    setIsRefreshing(true)
    // Reload the page to get fresh data from server
    window.location.reload()
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
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 max-w-full overflow-x-hidden">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
          {frCA.dashboard.student.title}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Bienvenue, {user.firstName} {user.lastName}
        </p>
      </div>

      {/* Navigation Tabs - Hamburger Menu on Mobile, Tabs on Desktop */}
      <div className="mb-6 md:mb-8">
        {/* Mobile: Hamburger Menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  {activeTab === 'overview' && (
                    <>
                      <Calendar className="h-4 w-4" />
                      Vue d'ensemble
                    </>
                  )}
                  {activeTab === 'reservations' && (
                    <>
                      <BookOpen className="h-4 w-4" />
                      Mes réservations
                    </>
                  )}
                  {activeTab === 'profile' && (
                    <>
                      <UserIcon className="h-4 w-4" />
                      Mon profil
                    </>
                  )}
                  {activeTab === 'messages' && (
                    <>
                      <MessageCircle className="h-4 w-4" />
                      Messages
                    </>
                  )}
                  {activeTab === 'tickets' && (
                    <>
                      <HelpCircle className="h-4 w-4" />
                      Support
                    </>
                  )}
                </span>
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuItem
                onClick={() => setActiveTab('overview')}
                className={activeTab === 'overview' ? 'bg-accent' : ''}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Vue d'ensemble
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab('reservations')}
                className={activeTab === 'reservations' ? 'bg-accent' : ''}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Mes réservations
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab('profile')}
                className={activeTab === 'profile' ? 'bg-accent' : ''}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab('messages')}
                className={activeTab === 'messages' ? 'bg-accent' : ''}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab('tickets')}
                className={activeTab === 'tickets' ? 'bg-accent' : ''}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop: Horizontal Tabs */}
        <div className="hidden md:flex space-x-1">
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
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3 w-full max-w-full min-w-0 grid-fix-mobile">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full min-w-0 max-w-full">
          {/* Upcoming Appointments */}
          <Card className="mb-4 sm:mb-6 w-full overflow-hidden">
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl break-words">{frCA.dashboard.student.upcomingAppointments}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {upcomingAppointments.length} rendez-vous à venir
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAppointments}
                  disabled={isRefreshing}
                  className="w-full sm:w-auto flex-shrink-0 min-w-0 overflow-hidden"
                >
                  <span className="truncate block">{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {isRefreshing && upcomingAppointments.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-3" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {frCA.dashboard.student.noAppointments}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 w-full min-w-0">
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
          <Card className="w-full overflow-hidden">
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <CardTitle className="text-lg sm:text-xl break-words min-w-0 flex-1">{frCA.dashboard.student.pastAppointments}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAppointments}
                  disabled={isRefreshing}
                  className="w-full sm:w-auto flex-shrink-0 min-w-0 overflow-hidden"
                >
                  <span className="truncate block">{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {isRefreshing && pastAppointments.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-3" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pastAppointments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucun rendez-vous passé
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 w-full min-w-0">
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

        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Quick Actions */}
          <Card className="mb-4 sm:mb-6 w-full overflow-hidden">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap min-w-0">
              {/* Show buttons for unique course/tutor combinations if any exist */}
              {uniqueCourseTutorCombinations.length > 0 && (
                <>
                  {uniqueCourseTutorCombinations.map((combo) => (
                    <Button
                      key={`${combo.courseId}-${combo.tutorId}`}
                      asChild
                      className="w-full sm:w-auto min-w-0"
                    >
                      <Link 
                        href={`/cours/${combo.courseSlug}/reservation?tutorId=${combo.tutorId}`}
                        className="truncate block"
                      >
                        Réserver d'autres séances de {combo.courseCode} avec {combo.tutorFirstName}
                      </Link>
                    </Button>
                  ))}
                </>
              )}
              {/* General button - always show if there are appointments, or if no appointments at all */}
              <Button
                asChild
                variant={uniqueCourseTutorCombinations.length > 0 ? "outline" : "default"}
                className="w-full sm:w-auto min-w-0"
              >
                <Link href="/cours" className="truncate block">
                  Réserver du tutorat pour d'autres cours
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{frCA.dashboard.student.myOrders}</CardTitle>
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
                              ? 'bg-success-light text-success dark:bg-success/20 dark:text-success'
                              : order.status === 'failed'
                              ? 'bg-error-light text-error dark:bg-error/20 dark:text-error'
                              : order.status === 'refunded' || order.status === 'partially_refunded'
                              ? 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning'
                              : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
                          }`}
                        >
                          {translateOrderStatus(order.status)}
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


