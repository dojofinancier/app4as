'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { Calendar, Clock, DollarSign, Users, Settings, Plus } from 'lucide-react'
import type { User, Tutor, Appointment, AvailabilityRule, AvailabilityException, TimeOff } from '@prisma/client'

interface TutorDashboardProps {
  user: User
  tutorProfile: Tutor & {
    user: User
    tutorCourses: Array<{
      course: {
        id: string
        titleFr: string
        slug: string
      }
    }>
  }
  appointments: Array<Appointment & {
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
    orderItem: {
      unitPriceCad: any
      lineTotalCad: any
    }
  }>
  availability: {
    rules: AvailabilityRule[]
    exceptions: AvailabilityException[]
    timeOffs: TimeOff[]
  }
}

const WEEKDAYS = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
]

export function TutorDashboard({ user, tutorProfile, appointments, availability }: TutorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'availability' | 'appointments'>('overview')

  // Defensive programming - ensure we have valid data
  const safeAppointments = appointments || []
  const safeAvailability = availability || { rules: [], exceptions: [], timeOffs: [] }

  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    return safeAppointments.filter(apt => {
      try {
        return new Date(apt.startDatetime) > now && apt.status === 'scheduled'
      } catch (error) {
        console.error('Error processing appointment date:', error)
        return false
      }
    })
  }, [safeAppointments])

  const todayAppointments = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return safeAppointments.filter(apt => {
      try {
        const aptDate = new Date(apt.startDatetime)
        return aptDate >= today && aptDate < tomorrow && apt.status === 'scheduled'
      } catch (error) {
        console.error('Error processing appointment date:', error)
        return false
      }
    })
  }, [safeAppointments])

  const scheduledAppointments = useMemo(() => {
    return safeAppointments.filter(apt => apt.status === 'scheduled')
  }, [safeAppointments])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Tableau de bord tuteur</h1>
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
          Vue d'ensemble
        </Button>
        <Button
          variant={activeTab === 'availability' ? 'default' : 'outline'}
          onClick={() => setActiveTab('availability')}
        >
          Disponibilités
        </Button>
        <Button
          variant={activeTab === 'appointments' ? 'default' : 'outline'}
          onClick={() => setActiveTab('appointments')}
        >
          Rendez-vous
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rendez-vous aujourd'hui</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAppointments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {todayAppointments.length === 0 ? 'Aucun rendez-vous' : 'Rendez-vous programmés'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rendez-vous à venir</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                <p className="text-xs text-muted-foreground">
                  Prochains rendez-vous
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tarif horaire</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Number(tutorProfile.hourlyBaseRateCad))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tarif de base
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tutor Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du profil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Nom d'affichage</p>
                  <p className="text-sm text-muted-foreground">{tutorProfile.displayName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Biographie</p>
                  <p className="text-sm text-muted-foreground">{tutorProfile.bioFr}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cours enseignés</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {tutorProfile.tutorCourses.map((tc) => (
                      <Badge key={tc.course.id} variant="outline">
                        {tc.course.titleFr}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Statut</p>
                  <Badge variant={tutorProfile.active ? "default" : "secondary"}>
                    {tutorProfile.active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Appointments */}
          {todayAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rendez-vous d'aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{appointment.course.titleFr}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.user.firstName} {appointment.user.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatTime(new Date(appointment.startDatetime))} - {formatTime(new Date(appointment.endDatetime))}
                        </p>
                        <Badge variant="secondary">{appointment.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Disponibilités récurrentes</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {safeAvailability.rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{WEEKDAYS[rule.weekday]}</p>
                      <p className="text-sm text-muted-foreground">
                        {rule.startTime} - {rule.endTime}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Modifier</Button>
                      <Button variant="outline" size="sm">Supprimer</Button>
                    </div>
                  </div>
                ))}
                {safeAvailability.rules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune disponibilité configurée</p>
                    <p className="text-sm mt-1">Ajoutez vos créneaux de disponibilité</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tous les rendez-vous</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{appointment.course.titleFr}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.user.firstName} {appointment.user.lastName} • {appointment.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(appointment.startDatetime))} • {formatTime(new Date(appointment.startDatetime))} - {formatTime(new Date(appointment.endDatetime))}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{appointment.status}</Badge>
                      <Button variant="outline" size="sm">Détails</Button>
                    </div>
                  </div>
                ))}
                {scheduledAppointments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun rendez-vous programmé</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

