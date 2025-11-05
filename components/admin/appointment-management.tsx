'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Calendar, Clock, User, BookOpen, Search, Plus, Eye, MoreHorizontal, Loader2, X, Check } from 'lucide-react'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { 
  getAllAppointments, 
  getAppointmentDetails, 
  createManualAppointment,
  updateAppointmentStatus,
  getTutorsForAutocomplete,
  getStudentsForAutocomplete,
  getCoursesForAutocomplete
} from '@/lib/actions/admin'

// Types
interface Appointment {
  id: string
  startDatetime: Date
  endDatetime: Date
  status: 'scheduled' | 'cancelled' | 'completed' | 'refunded'
  cancellationReason?: string | null
  cancelledAt?: Date | null
  meetingLink?: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  tutor: {
    id: string
    displayName: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
  course: {
    id: string
    titleFr: string
    slug: string
  }
  orderItem: {
    id: string
    unitPriceCad: number
    lineTotalCad: number
    tutorEarningsCad: number
  }
}

interface Tutor {
  id: string
  displayName: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Course {
  id: string
  titleFr: string
  slug: string
}

type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed' | 'refunded' | 'all'

export function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  // Filters
  const [status, setStatus] = useState<AppointmentStatus>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [tutorId, setTutorId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')

  // Autocomplete data
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Manual appointment form state
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    studentId: '',
    tutorId: '',
    courseId: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    meetingLink: '',
    reason: ''
  })

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch appointments
  const fetchAppointments = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setAppointments([])
        setNextCursor(null)
      } else {
        setLoadingMore(true)
      }

      const result = await getAllAppointments({
        status: status === 'all' ? undefined : status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
        tutorId: tutorId || undefined,
        studentId: studentId || undefined,
        courseId: courseId || undefined,
        cursor: reset ? undefined : nextCursor || undefined,
        limit: 20
      })

      if (result.success && result.data) {
        // Convert Decimal fields to numbers
        const serializedAppointments = result.data.appointments.map(appointment => ({
          ...appointment,
          orderItem: {
            ...appointment.orderItem,
            unitPriceCad: Number(appointment.orderItem.unitPriceCad),
            lineTotalCad: Number(appointment.orderItem.lineTotalCad),
            tutorEarningsCad: Number(appointment.orderItem.tutorEarningsCad)
          }
        }))

        if (reset) {
          setAppointments(serializedAppointments)
        } else {
          setAppointments(prev => [...prev, ...serializedAppointments])
        }
        setHasMore(result.data.hasMore)
        setNextCursor(result.data.nextCursor)
      } else {
        setError(result.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load more appointments
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchAppointments(false)
    }
  }

  // Apply filters
  const applyFilters = () => {
    fetchAppointments(true)
  }

  // Clear filters
  const clearFilters = () => {
    setStatus('all')
    setStartDate('')
    setEndDate('')
    setSearch('')
    setTutorId('')
    setStudentId('')
    setCourseId('')
    fetchAppointments(true)
  }

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setCreateError(null)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      studentId: '',
      tutorId: '',
      courseId: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      meetingLink: '',
      reason: ''
    })
    setCreateError(null)
  }

  // Load appointment details
  const loadAppointmentDetails = async (appointmentId: string) => {
    try {
      setLoadingDetails(true)
      const result = await getAppointmentDetails(appointmentId)
      
      if (result.success && result.data) {
        setAppointmentDetails(result.data)
      } else {
        setError(result.error || 'Erreur lors du chargement des détails')
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Handle appointment details view
  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailsModalOpen(true)
    loadAppointmentDetails(appointment.id)
  }

  // Handle status change
  const handleStatusChange = async (appointmentId: string, newStatus: string, reason?: string) => {
    try {
      const result = await updateAppointmentStatus(appointmentId, newStatus as any, reason)
      
      if (result.success) {
        // Refresh appointments list
        fetchAppointments(true)
        // Close details modal if open
        if (selectedAppointment?.id === appointmentId) {
          setIsDetailsModalOpen(false)
        }
      } else {
        setError(result.error || 'Erreur lors du changement de statut')
      }
    } catch (error) {
      setError('Une erreur est survenue')
    }
  }

  // Handle cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    const reason = prompt('Raison de l\'annulation:')
    if (reason) {
      await handleStatusChange(appointmentId, 'cancelled', reason)
    }
  }

  // Handle form submission
  const handleCreateAppointment = async () => {
    try {
      setIsCreating(true)
      setCreateError(null)

      // Validation
      if (!formData.studentId || !formData.tutorId || !formData.courseId) {
        setCreateError('Veuillez sélectionner un étudiant, un tuteur et un cours')
        return
      }

      if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
        setCreateError('Veuillez remplir les dates et heures de début et fin')
        return
      }

      // Create datetime strings
      const startDatetime = `${formData.startDate}T${formData.startTime}:00`
      const endDatetime = `${formData.endDate}T${formData.endTime}:00`

      // Validate dates
      const start = new Date(startDatetime)
      const end = new Date(endDatetime)

      if (start >= end) {
        setCreateError('La date de fin doit être après la date de début')
        return
      }

      // Create appointment
      const result = await createManualAppointment({
        studentId: formData.studentId,
        tutorId: formData.tutorId,
        courseId: formData.courseId,
        startDatetime,
        endDatetime,
        meetingLink: formData.meetingLink || undefined,
        reason: formData.reason || undefined
      })

      if (result.success) {
        // Close modal and refresh data
        setIsCreateModalOpen(false)
        resetForm()
        fetchAppointments(true)
      } else {
        setCreateError(result.error || 'Erreur lors de la création')
      }
    } catch (error) {
      setCreateError('Une erreur est survenue')
    } finally {
      setIsCreating(false)
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default'
      case 'cancelled':
        return 'destructive'
      case 'completed':
        return 'secondary'
      case 'refunded':
        return 'outline'
      default:
        return 'default'
    }
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programmé'
      case 'cancelled':
        return 'Annulé'
      case 'completed':
        return 'Terminé'
      case 'refunded':
        return 'Remboursé'
      default:
        return status
    }
  }

  // Load initial data
  useEffect(() => {
    fetchAppointments(true)
  }, [])

  // Infinite scroll
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
  }, [hasMore, loadingMore])

  // Load autocomplete data
  useEffect(() => {
    const loadAutocompleteData = async () => {
      try {
        const [tutorsResult, studentsResult, coursesResult] = await Promise.all([
          getTutorsForAutocomplete(),
          getStudentsForAutocomplete(),
          getCoursesForAutocomplete()
        ])

        if (tutorsResult.success && tutorsResult.data) setTutors(tutorsResult.data)
        if (studentsResult.success && studentsResult.data) setStudents(studentsResult.data)
        if (coursesResult.success && coursesResult.data) setCourses(coursesResult.data)
      } catch (error) {
        console.error('Error loading autocomplete data:', error)
      }
    }

    loadAutocompleteData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des rendez-vous...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des rendez-vous</h2>
          <p className="text-muted-foreground">
            Gérez tous les rendez-vous et créez des rendez-vous manuels
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un rendez-vous
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un rendez-vous manuel</DialogTitle>
              <DialogDescription>
                Créez un rendez-vous gratuit pour un étudiant (le tuteur sera payé)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {createError && (
                <div className="p-3 bg-error-light border border-error-border rounded-md text-error text-sm">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Selection */}
                <div>
                  <Label htmlFor="student">Étudiant *</Label>
                  <Select 
                    value={formData.studentId} 
                    onValueChange={(value) => handleFormChange('studentId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un étudiant" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tutor Selection */}
                <div>
                  <Label htmlFor="tutor">Tuteur *</Label>
                  <Select 
                    value={formData.tutorId} 
                    onValueChange={(value) => handleFormChange('tutorId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un tuteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {tutors.map((tutor) => (
                        <SelectItem key={tutor.id} value={tutor.id}>
                          {tutor.user.firstName} {tutor.user.lastName} ({tutor.displayName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Course Selection */}
              <div>
                <Label htmlFor="course">Cours *</Label>
                <Select 
                  value={formData.courseId} 
                  onValueChange={(value) => handleFormChange('courseId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un cours" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.titleFr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Date de début *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Heure de début *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleFormChange('startTime', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Date de fin *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Heure de fin *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleFormChange('endTime', e.target.value)}
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <Label htmlFor="meetingLink">Lien de réunion (optionnel)</Label>
                <Input
                  id="meetingLink"
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={formData.meetingLink}
                  onChange={(e) => handleFormChange('meetingLink', e.target.value)}
                />
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="reason">Raison (optionnel)</Label>
                <Input
                  id="reason"
                  placeholder="Ex: Transfert de cours, compensation..."
                  value={formData.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    resetForm()
                  }}
                  disabled={isCreating}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateAppointment}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Créer le rendez-vous
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={(value: AppointmentStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="scheduled">Programmé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="refunded">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Search */}
            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom, email, cours..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyFilters}>
              Appliquer les filtres
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Effacer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rendez-vous ({appointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-error text-center p-4">
              {error}
            </div>
          )}

          {appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rendez-vous trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDateTime(appointment.startDatetime)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {Math.round((appointment.endDatetime.getTime() - appointment.startDatetime.getTime()) / (1000 * 60))} min
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Étudiant</span>
                          </div>
                          <div>{appointment.user.firstName} {appointment.user.lastName}</div>
                          <div className="text-muted-foreground">{appointment.user.email}</div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Tuteur</span>
                          </div>
                          <div>{appointment.tutor.user.firstName} {appointment.tutor.user.lastName}</div>
                          <div className="text-muted-foreground">{appointment.tutor.user.email}</div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-medium">Cours</span>
                          </div>
                          <div>{appointment.course.titleFr}</div>
                          <div className="text-muted-foreground">
                            {formatCurrency(appointment.orderItem.lineTotalCad)} 
                            {appointment.orderItem.lineTotalCad === 0 && ' (Gratuit)'}
                          </div>
                        </div>
                      </div>

                      {appointment.cancellationReason && (
                        <div className="mt-2 p-2 bg-error-light border border-error-border rounded text-sm text-error">
                          <strong>Raison d'annulation:</strong> {appointment.cancellationReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(appointment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {appointment.status === 'scheduled' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'completed')}>
                                Marquer comme terminé
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCancelAppointment(appointment.id)}>
                                Annuler
                              </DropdownMenuItem>
                            </>
                          )}
                          {appointment.status === 'cancelled' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'scheduled', 'Rendez-vous réactivé')}>
                              Réactiver
                            </DropdownMenuItem>
                          )}
                          {appointment.status === 'completed' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'scheduled', 'Statut modifié')}>
                              Revenir à programmé
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="text-center py-4">
                  {loadingMore ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Chargement...
                    </div>
                  ) : (
                    <Button variant="outline" onClick={loadMore}>
                      Charger plus
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du rendez-vous</DialogTitle>
            <DialogDescription>
              Informations complètes et historique des modifications
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des détails...</span>
            </div>
          ) : appointmentDetails ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Statut</Label>
                      <div className="mt-1">
                        <Badge variant={getStatusBadgeVariant(appointmentDetails.status)}>
                          {getStatusLabel(appointmentDetails.status)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date et heure</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(appointmentDetails.startDatetime)} - {formatDateTime(appointmentDetails.endDatetime)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Durée</Label>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((new Date(appointmentDetails.endDatetime).getTime() - new Date(appointmentDetails.startDatetime).getTime()) / (1000 * 60))} minutes
                      </p>
                    </div>
                    {appointmentDetails.meetingLink && (
                      <div>
                        <Label className="text-sm font-medium">Lien de réunion</Label>
                        <p className="text-sm">
                          <a 
                            href={appointmentDetails.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-info hover:underline"
                          >
                            {appointmentDetails.meetingLink}
                          </a>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Participants</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Étudiant</Label>
                      <div className="mt-1">
                        <p className="font-medium">{appointmentDetails.user.firstName} {appointmentDetails.user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{appointmentDetails.user.email}</p>
                        {appointmentDetails.user.phone && (
                          <p className="text-sm text-muted-foreground">{appointmentDetails.user.phone}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tuteur</Label>
                      <div className="mt-1">
                        <p className="font-medium">{appointmentDetails.tutor.user.firstName} {appointmentDetails.tutor.user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{appointmentDetails.tutor.user.email}</p>
                        {appointmentDetails.tutor.user.phone && (
                          <p className="text-sm text-muted-foreground">{appointmentDetails.tutor.user.phone}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Cours</Label>
                      <div className="mt-1">
                        <p className="font-medium">{appointmentDetails.course.titleFr}</p>
                        <p className="text-sm text-muted-foreground">Prix: {formatCurrency(Number(appointmentDetails.course.studentRateCad))}/heure</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations financières</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Prix unitaire</Label>
                      <p className="text-lg font-semibold">
                        {formatCurrency(Number(appointmentDetails.orderItem.unitPriceCad))}
                        {Number(appointmentDetails.orderItem.unitPriceCad) === 0 && ' (Gratuit)'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total</Label>
                      <p className="text-lg font-semibold">
                        {formatCurrency(Number(appointmentDetails.orderItem.lineTotalCad))}
                        {Number(appointmentDetails.orderItem.lineTotalCad) === 0 && ' (Gratuit)'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Gains du tuteur</Label>
                      <p className="text-lg font-semibold text-success">
                        {formatCurrency(Number(appointmentDetails.orderItem.tutorEarningsCad))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Statut de la commande:</span>
                      <Badge variant={appointmentDetails.orderItem.order.status === 'paid' ? 'default' : 'secondary'}>
                        {appointmentDetails.orderItem.order.status === 'paid' ? 'Payé' : appointmentDetails.orderItem.order.status}
                      </Badge>
                    </div>
                    {appointmentDetails.orderItem.order.stripePaymentIntentId && (
                      <div className="flex justify-between text-sm mt-2">
                        <span>ID de paiement Stripe:</span>
                        <span className="font-mono text-xs">{appointmentDetails.orderItem.order.stripePaymentIntentId}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cancellation Information */}
              {appointmentDetails.status === 'cancelled' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-error">Informations d'annulation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">Raison d'annulation</Label>
                        <p className="text-sm">{appointmentDetails.cancellationReason}</p>
                      </div>
                      {appointmentDetails.cancelledAt && (
                        <div>
                          <Label className="text-sm font-medium">Date d'annulation</Label>
                          <p className="text-sm">{formatDateTime(appointmentDetails.cancelledAt)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Modification History */}
              {appointmentDetails.modifications && appointmentDetails.modifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historique des modifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {appointmentDetails.modifications.map((modification: any) => (
                        <div key={modification.id} className="border-l-4 border-info-border pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">
                                {modification.modificationType === 'manual_creation' && 'Création manuelle'}
                                {modification.modificationType === 'status_change' && 'Changement de statut'}
                                {modification.modificationType === 'time_change' && 'Changement d\'horaire'}
                                {modification.modificationType === 'tutor_change' && 'Changement de tuteur'}
                              </p>
                              {modification.reason && (
                                <p className="text-sm text-muted-foreground">{modification.reason}</p>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>{modification.modifier.firstName} {modification.modifier.lastName}</p>
                              <p>{modification.modifier.role}</p>
                              <p>{formatDateTime(modification.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Aucun détail disponible
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
