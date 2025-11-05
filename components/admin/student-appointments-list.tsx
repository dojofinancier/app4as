'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/utils'
import { 
  Calendar,
  Clock,
  XCircle,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { getStudentAppointments } from '@/lib/actions/admin'

interface StudentAppointmentsListProps {
  studentId: string
}

interface Appointment {
  id: string
  startDatetime: Date
  endDatetime: Date
  status: string
  cancellationReason?: string | null
  cancelledBy?: string | null
  cancelledAt?: Date | null
  course: {
    titleFr: string
  }
  tutor: {
    displayName: string
  }
}

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled'

export function StudentAppointmentsList({ studentId }: StudentAppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [initialLoad, setInitialLoad] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const filters: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tous', icon: <Calendar className="h-4 w-4" /> },
    { key: 'upcoming', label: 'À venir', icon: <Clock className="h-4 w-4" /> },
    { key: 'past', label: 'Passés', icon: <CheckCircle className="h-4 w-4" /> },
    { key: 'cancelled', label: 'Annulés', icon: <XCircle className="h-4 w-4" /> }
  ]

  const fetchAppointments = async (cursor?: string, append = false) => {
    if (!studentId) return

    const loadingState = append ? setLoadingMore : setLoading
    loadingState(true)
    setError(null)

    try {
      const result = await getStudentAppointments(studentId, {
        filter: activeFilter,
        cursor,
        limit: 20
      })

      if (result.success && result.data) {
        const newAppointments = result.data.appointments.map(apt => ({
          ...apt,
          startDatetime: new Date(apt.startDatetime),
          endDatetime: new Date(apt.endDatetime),
          cancelledAt: apt.cancelledAt ? new Date(apt.cancelledAt) : undefined
        }))

        if (append) {
          setAppointments(prev => [...prev, ...newAppointments])
        } else {
          setAppointments(newAppointments)
        }

        setHasMore(result.data.hasMore)
        setNextCursor(result.data.nextCursor)
      } else {
        setError(result.error || 'Erreur lors du chargement des rendez-vous')
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setError('Une erreur est survenue')
    } finally {
      loadingState(false)
      setInitialLoad(false)
    }
  }

  const loadMore = () => {
    if (hasMore && nextCursor && !loadingMore) {
      fetchAppointments(nextCursor, true)
    }
  }

  // Load appointments when filter changes
  useEffect(() => {
    setAppointments([])
    setNextCursor(null)
    setHasMore(true)
    fetchAppointments()
  }, [activeFilter])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, nextCursor])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="default" className="bg-info-light text-info">Programmé</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-success-light text-success">Terminé</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>
      case 'refunded':
        return <Badge variant="outline" className="border-warning-border text-warning">Remboursé</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-info" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-error" />
      case 'refunded':
        return <AlertCircle className="h-4 w-4 text-warning" />
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (initialLoad && loading) {
    return (
      <div className="h-full flex flex-col">
        {/* Filter Buttons Skeleton */}
        <div className="p-6 pb-4 border-b">
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-24" />
            ))}
          </div>
        </div>

        {/* Appointments List Skeleton */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter Buttons */}
      <div className="p-6 pb-4 border-b">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.key)}
              className="flex items-center gap-2"
            >
              {filter.icon}
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {error ? (
          <div className="text-center text-destructive py-8">
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun rendez-vous trouvé</p>
            <p className="text-sm">Aucun rendez-vous ne correspond aux filtres sélectionnés.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(appointment.status)}
                        <div>
                          <h3 className="font-semibold text-lg">
                            {appointment.course.titleFr}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            avec {appointment.tutor.displayName}
                          </p>
                        </div>
                        <div className="ml-auto">
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Date:</span>
                          <span>{formatDateTime(appointment.startDatetime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Durée:</span>
                          <span>
                            {Math.round((appointment.endDatetime.getTime() - appointment.startDatetime.getTime()) / (1000 * 60))} min
                          </span>
                        </div>
                      </div>

                      {/* Cancellation details */}
                      {appointment.status === 'cancelled' && appointment.cancellationReason && (
                        <div className="mt-4 p-3 bg-error-light border border-error-border rounded-lg">
                          <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-error mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-error">
                                Annulé par: {appointment.cancelledBy === 'student' ? 'Étudiant' : 
                                            appointment.cancelledBy === 'tutor' ? 'Tuteur' : 
                                            appointment.cancelledBy === 'admin' ? 'Administrateur' : 'Système'}
                              </p>
                              {appointment.cancelledAt && (
                                <p className="text-xs text-error mb-2">
                                  Le {formatDateTime(appointment.cancelledAt)}
                                </p>
                              )}
                              <p className="text-sm text-error">
                                <span className="font-medium">Raison:</span> {appointment.cancellationReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4">
                {loadingMore ? (
                  <div className="text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Chargement...
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="w-full"
                  >
                    Charger plus
                  </Button>
                )}
              </div>
            )}

            {!hasMore && appointments.length > 0 && (
              <div className="text-center text-muted-foreground py-4 text-sm">
                Tous les rendez-vous ont été chargés
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
