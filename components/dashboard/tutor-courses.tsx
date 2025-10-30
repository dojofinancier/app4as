'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  getTutorCourses,
  getAvailableCoursesForTutor,
  getTutorCourseRequests,
  requestCourseAssignment,
  cancelCourseRequest,
  TutorCourseData,
  CourseRequestData,
  AvailableCourseData
} from '@/lib/actions/tutor-courses'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Plus, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  GraduationCap,
  Tag,
  DollarSign,
  MessageSquare,
  Trash2
} from 'lucide-react'

interface TutorCoursesProps {
  tutorId?: string
}

export function TutorCourses({ tutorId }: TutorCoursesProps) {
  const [assignedCourses, setAssignedCourses] = useState<TutorCourseData[]>([])
  const [availableCourses, setAvailableCourses] = useState<AvailableCourseData[]>([])
  const [pendingRequests, setPendingRequests] = useState<CourseRequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<AvailableCourseData | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (tutorId) {
      loadData()
    }
  }, [tutorId])

  const loadData = async () => {
    if (!tutorId) return
    
    setLoading(true)
    try {
      const [assignedResult, availableResult, requestsResult] = await Promise.all([
        getTutorCourses(tutorId),
        getAvailableCoursesForTutor(tutorId),
        getTutorCourseRequests(tutorId)
      ])

      if (assignedResult.success) {
        setAssignedCourses(assignedResult.data || [])
      }
      if (availableResult.success) {
        setAvailableCourses(availableResult.data || [])
      }
      if (requestsResult.success) {
        setPendingRequests(requestsResult.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestCourse = async () => {
    if (!selectedCourse) return

    try {
      const result = await requestCourseAssignment(selectedCourse.id, requestMessage)
      if (result.success) {
        setIsRequestDialogOpen(false)
        setRequestMessage('')
        setSelectedCourse(null)
        loadData()
        alert('Demande envoyée avec succès')
      } else {
        alert(result.error || 'Erreur lors de l\'envoi de la demande')
      }
    } catch (error) {
      console.error('Error requesting course:', error)
      alert('Erreur lors de l\'envoi de la demande')
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return

    try {
      const result = await cancelCourseRequest(requestId)
      if (result.success) {
        loadData()
        alert('Demande annulée avec succès')
      } else {
        alert(result.error || 'Erreur lors de l\'annulation de la demande')
      }
    } catch (error) {
      console.error('Error canceling request:', error)
      alert('Erreur lors de l\'annulation de la demande')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredAvailableCourses = availableCourses.filter(course =>
    course.titleFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.institution && course.institution.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (course.domain && course.domain.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mes cours</CardTitle>
            <CardDescription>Chargement...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Assigned Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Cours assignés ({assignedCourses.length})
          </CardTitle>
          <CardDescription>
            Cours que vous enseignez actuellement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedCourses.length > 0 ? (
            <div className="space-y-4">
              {assignedCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{course.course.titleFr}</h3>
                      <span className="text-sm text-muted-foreground">({course.course.code})</span>
                      {getStatusBadge(course.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {course.course.descriptionFr}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {course.course.institution && (
                        <div className="flex items-center space-x-1">
                          <GraduationCap className="h-4 w-4" />
                          <span>{course.course.institution}</span>
                        </div>
                      )}
                      {course.course.domain && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-4 w-4" />
                          <span>{course.course.domain}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun cours assigné</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Demandes en cours ({pendingRequests.length})
          </CardTitle>
          <CardDescription>
            Cours que vous avez demandés et qui sont en attente d'approbation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{request.course.titleFr}</h3>
                      <span className="text-sm text-muted-foreground">({request.course.code})</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {request.course.descriptionFr}
                    </p>
                    {request.message && (
                      <div className="flex items-start space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
                      </div>
                    )}
                    {request.adminNote && (
                      <div className="flex items-start space-x-2 mb-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 text-red-500" />
                        <p className="text-sm text-red-600 italic">Admin: "{request.adminNote}"</p>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Demandé le {formatDate(request.requestedAt)}</span>
                      {request.reviewedAt && (
                        <span>Traité le {formatDate(request.reviewedAt)}</span>
                      )}
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelRequest(request.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune demande en cours</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Demander un cours
              </CardTitle>
              <CardDescription>
                Parcourez les cours disponibles et demandez à les enseigner
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="search">Rechercher un cours</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Titre, code, institution, domaine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredAvailableCourses.length > 0 ? (
            <div className="space-y-4">
              {filteredAvailableCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{course.titleFr}</h3>
                      <span className="text-sm text-muted-foreground">({course.code})</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {course.descriptionFr}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {course.institution && (
                        <div className="flex items-center space-x-1">
                          <GraduationCap className="h-4 w-4" />
                          <span>{course.institution}</span>
                        </div>
                      )}
                      {course.domain && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-4 w-4" />
                          <span>{course.domain}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course._count.tutorCourses} tuteur(s)</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedCourse(course)
                      setIsRequestDialogOpen(true)
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Demander
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun cours disponible</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Course Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander à enseigner un cours</DialogTitle>
            <DialogDescription>
              {selectedCourse?.titleFr} - {selectedCourse?.code}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea
                id="message"
                placeholder="Expliquez pourquoi vous souhaitez enseigner ce cours..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRequestCourse}>
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
