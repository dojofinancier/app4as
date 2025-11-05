'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  getAllCourseRequests,
  approveCourseRequest,
  rejectCourseRequest
} from '@/lib/actions/tutor-courses'
import { formatDate } from '@/lib/utils'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  MessageSquare,
  BookOpen,
  AlertCircle
} from 'lucide-react'

interface CourseRequest {
  id: string
  status: string
  message?: string
  requestedAt: Date
  reviewedAt?: Date
  adminNote?: string
  course: {
    id: string
    code: string
    titleFr: string
    descriptionFr: string
    institution?: string
    domain?: string
    studentRateCad: number
    active: boolean
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
  reviewer?: {
    firstName: string
    lastName: string
    email: string
  }
}

export function CourseRequests() {
  const [requests, setRequests] = useState<CourseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<CourseRequest | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  useEffect(() => {
    loadRequests()
  }, [filter, searchTerm])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const result = await getAllCourseRequests({
        status: filter,
        search: searchTerm || undefined
      })
      
      if (result.success) {
        setRequests(result.data || [])
      } else {
        console.error('Error loading requests:', result.error)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir approuver cette demande ?')) return

    try {
      const result = await approveCourseRequest(requestId)
      if (result.success) {
        loadRequests()
        alert('Demande approuvée avec succès')
      } else {
        alert(result.error || 'Erreur lors de l\'approbation')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      alert('Erreur lors de l\'approbation')
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedRequest) return

    try {
      const result = await rejectCourseRequest(selectedRequest.id, rejectNote)
      if (result.success) {
        setIsRejectDialogOpen(false)
        setRejectNote('')
        setSelectedRequest(null)
        loadRequests()
        alert('Demande rejetée avec succès')
      } else {
        alert(result.error || 'Erreur lors du rejet')
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert('Erreur lors du rejet')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-success-light text-success"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-warning-light text-warning"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-error-light text-error"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusCounts = () => {
    const counts = {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    }
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Demandes de cours</CardTitle>
            <CardDescription>Chargement...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Demandes de cours</CardTitle>
              <CardDescription>
                Gérez les demandes des tuteurs pour enseigner des cours
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tuteur, cours, code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Statut</Label>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous ({statusCounts.all})</SelectItem>
                  <SelectItem value="pending">En attente ({statusCounts.pending})</SelectItem>
                  <SelectItem value="approved">Approuvés ({statusCounts.approved})</SelectItem>
                  <SelectItem value="rejected">Rejetés ({statusCounts.rejected})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadRequests} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tuteur</TableHead>
                  <TableHead>Cours</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de demande</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.tutor.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.tutor.user.firstName} {request.tutor.user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.tutor.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.course.titleFr}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.course.code}
                        </div>
                        {request.course.institution && (
                          <div className="text-xs text-muted-foreground">
                            {request.course.institution}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.message ? (
                        <div className="max-w-xs">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {request.message}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Aucun message</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(request.requestedAt)}</div>
                        {request.reviewedAt && (
                          <div className="text-xs text-muted-foreground">
                            Traité le {formatDate(request.reviewedAt)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              className="bg-success hover:bg-success/90"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request)
                                setIsRejectDialogOpen(true)
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                          </>
                        )}
                        {request.status === 'rejected' && request.adminNote && (
                          <div className="text-xs text-error max-w-xs">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            {request.adminNote}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {requests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune demande trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Request Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>
              {selectedRequest?.tutor.displayName} - {selectedRequest?.course.titleFr}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-note">Note pour le tuteur (optionnel)</Label>
              <Textarea
                id="reject-note"
                placeholder="Expliquez pourquoi cette demande est rejetée..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRejectRequest}>
              Rejeter la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
