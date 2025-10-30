'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AvailabilityManagementTab } from './tutor/availability-management-tab'
import { TutorAppointmentCard } from './tutor-appointment-card'
import { TutorMessagingTab } from './tutor/tutor-messaging-tab'
import { TutorProfileTab } from './tutor/tutor-profile-tab'
import { TutorEarningsDashboard } from './tutor-earnings-dashboard'
import { TutorCourses } from './tutor-courses'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Calendar, Clock, Users, DollarSign, BookOpen, TrendingUp, MessageCircle } from 'lucide-react'
import type { Appointment, Course, Tutor, User } from '@prisma/client'
import { getUnreadMessageCount } from '@/lib/actions/messaging'
import { TutorRatingsTab } from './tutor-ratings-tab'

interface TutorDashboardProps {
  tutorId: string
  tutorName: string
  tutorProfile?: {
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
    tutorCourses: Array<{
      id: string
      tutorId: string
      courseId: string
      active: boolean
      course: {
        id: string
        slug: string
        titleFr: string
        descriptionFr: string
        active: boolean
        createdAt: Date
        studentRateCad: number
      }
    }>
  }
  appointments?: Array<{
    id: string
    userId: string
    tutorId: string
    courseId: string
    startDatetime: Date
    endDatetime: Date
    status: string
    meetingLink?: string | null
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
    }
    course: {
      id: string
      titleFr: string
      slug: string
    }
    orderItem?: {
      unitPriceCad: number
      lineTotalCad: number
    } | null
  }>
}

export function TutorDashboard({ tutorId, tutorName, tutorProfile, appointments = [] }: TutorDashboardProps) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null)
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0)

  // Load unread message count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const result = await getUnreadMessageCount()
        if (result.success && result.count !== undefined) {
          setUnreadMessageCount(result.count)
        }
      } catch (error) {
        console.error('Error loading unread count:', error)
      }
    }

    loadUnreadCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab')
    const student = searchParams.get('student')
    
    if (tab === 'messages') {
      setActiveTab('messages')
    }
    
    if (student) {
      setSelectedStudentId(student)
      // Find student info from appointments
      const appointment = appointments.find(apt => apt.userId === student)
      if (appointment) {
        setSelectedStudentInfo({
          id: appointment.userId,
          firstName: appointment.user.firstName,
          lastName: appointment.user.lastName,
          role: 'student'
        })
      }
    }
  }, [searchParams, appointments])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Tableau de bord - {tutorName}
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos disponibilités et vos rendez-vous
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="availability">Disponibilités</TabsTrigger>
            <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
            <TabsTrigger value="courses">Mes cours</TabsTrigger>
            <TabsTrigger value="earnings">Honoraires</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
              {unreadMessageCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ratings">Évaluations</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab 
              tutorProfile={tutorProfile}
              appointments={appointments}
            />
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <AvailabilityManagementTab tutorId={tutorId} />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <AppointmentsTab appointments={appointments} />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <TutorCourses tutorId={tutorId} />
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <TutorEarningsDashboard tutorId={tutorId} />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <TutorMessagingTab selectedStudentInfo={selectedStudentInfo} />
          </TabsContent>

          <TabsContent value="ratings" className="space-y-6">
            <TutorRatingsTab tutorId={tutorId} />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {tutorProfile ? (
              <TutorProfileTab tutorProfile={tutorProfile} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Mon profil</CardTitle>
                  <CardDescription>
                    Chargement du profil...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Impossible de charger les informations du profil.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Overview Tab Component
interface OverviewTabProps {
  tutorProfile?: {
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
    tutorCourses: Array<{
      id: string
      tutorId: string
      courseId: string
      active: boolean
      course: {
        id: string
        slug: string
        titleFr: string
        descriptionFr: string
        active: boolean
        createdAt: Date
        studentRateCad: number
      }
    }>
  }
  appointments: Array<{
    id: string
    userId: string
    tutorId: string
    courseId: string
    startDatetime: Date
    endDatetime: Date
    status: string
    meetingLink?: string | null
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
    }
    course: {
      id: string
      titleFr: string
      slug: string
    }
    orderItem?: {
      unitPriceCad: number
      lineTotalCad: number
    } | null
  }>
}

function OverviewTab({ tutorProfile, appointments }: OverviewTabProps) {
  const getUpcomingAppointments = () => {
    const now = new Date()
    return appointments.filter(apt => new Date(apt.startDatetime) > now && apt.status === 'scheduled')
  }

  const getTodayAppointments = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startDatetime)
      return aptDate >= today && aptDate < tomorrow && apt.status === 'scheduled'
    })
  }

  const getScheduledAppointments = () => {
    return appointments.filter(apt => apt.status === 'scheduled')
  }

  const getCompletedAppointments = () => {
    return appointments.filter(apt => apt.status === 'completed')
  }

  const getTotalEarnings = () => {
    return appointments
      .filter(apt => apt.status === 'completed' && apt.orderItem)
      .reduce((total, apt) => {
        const duration = Math.round(
          (new Date(apt.endDatetime).getTime() - new Date(apt.startDatetime).getTime()) / 1000 / 60
        )
        const hourlyRate = Number(apt.orderItem?.unitPriceCad || 0)
        const earnings = (duration / 60) * hourlyRate
        return total + earnings
      }, 0)
  }

  const upcomingAppointments = getUpcomingAppointments()
  const todayAppointments = getTodayAppointments()
  const scheduledCount = getScheduledAppointments().length
  const completedCount = getCompletedAppointments().length
  const totalEarnings = getTotalEarnings()
  const coursesCount = tutorProfile?.tutorCourses?.length || 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendez-vous à venir</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayAppointments.length} aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Séances complétées</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              sur {scheduledCount + completedCount} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cours enseignés</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coursesCount}</div>
            <p className="text-xs text-muted-foreground">
              cours actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Honoraires totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              depuis le début
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Prochains rendez-vous</CardTitle>
          <CardDescription>
            Vos prochaines séances programmées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-muted-foreground">Aucun rendez-vous à venir</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{appointment.course.titleFr}</h4>
                    <p className="text-sm text-muted-foreground">
                      Étudiant: {appointment.user.firstName} {appointment.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(new Date(appointment.startDatetime))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {Math.round(
                        (new Date(appointment.endDatetime).getTime() - 
                         new Date(appointment.startDatetime).getTime()) / 1000 / 60
                      )} min
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Summary */}
      {tutorProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Résumé du profil</CardTitle>
            <CardDescription>
              Informations sur votre profil tuteur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Informations personnelles</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Nom:</span> {tutorProfile.user.firstName} {tutorProfile.user.lastName}</p>
                  <p><span className="text-muted-foreground">Email:</span> {tutorProfile.user.email}</p>
                  {tutorProfile.user.phone && (
                    <p><span className="text-muted-foreground">Téléphone:</span> {tutorProfile.user.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Informations professionnelles</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Tarif horaire:</span> {formatCurrency(Number(tutorProfile.hourlyBaseRateCad))}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Statut:</span>
                    <Badge variant={tutorProfile.active ? "default" : "secondary"}>
                      {tutorProfile.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <p><span className="text-muted-foreground">Cours assignés:</span> {coursesCount}</p>
                </div>
              </div>
            </div>
            {tutorProfile.bioFr && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Biographie</h4>
                <p className="text-sm text-muted-foreground">{tutorProfile.bioFr}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Appointments Tab Component
interface AppointmentsTabProps {
  appointments: Array<{
    id: string
    userId: string
    tutorId: string
    courseId: string
    startDatetime: Date
    endDatetime: Date
    status: string
    meetingLink?: string | null
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
    }
    course: {
      id: string
      titleFr: string
      slug: string
    }
    orderItem?: {
      unitPriceCad: number
      lineTotalCad: number
    } | null
  }>
}

function AppointmentsTab({ appointments }: AppointmentsTabProps) {
  const now = new Date()
  
  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.startDatetime) > now && apt.status === 'scheduled')
    .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
    
  const pastAppointments = appointments
    .filter((apt) => new Date(apt.startDatetime) <= now || apt.status !== 'scheduled')
    .sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime())

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {/* Upcoming Appointments */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prochains rendez-vous</CardTitle>
            <CardDescription>
              {upcomingAppointments.length} rendez-vous à venir
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
                  <TutorAppointmentCard
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
            <CardTitle>Rendez-vous passés</CardTitle>
            <CardDescription>
              Historique de vos séances
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pastAppointments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Aucun rendez-vous passé
              </div>
            ) : (
              <div className="space-y-4">
                {pastAppointments.slice(0, 10).map((appointment) => (
                  <TutorAppointmentCard
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
        {/* Quick Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">À venir:</span>
              <span className="font-semibold">{upcomingAppointments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Terminés:</span>
              <span className="font-semibold">
                {pastAppointments.filter(apt => apt.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Annulés:</span>
              <span className="font-semibold">
                {pastAppointments.filter(apt => apt.status === 'cancelled').length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/cours">Voir les cours disponibles</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/tableau-de-bord?tab=availability">Gérer mes disponibilités</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}