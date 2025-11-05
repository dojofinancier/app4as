'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  CreditCard,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ticket
} from 'lucide-react'
import { 
  getAllStudents,
  getStudentDetails,
  getStudentAppointments,
  getStudentOrders,
  getStudentMessages
} from '@/lib/actions/admin'
import { StudentAppointmentsList } from './student-appointments-list'
import { StudentOrdersList } from './student-orders-list'
import { StudentMessagesList } from './student-messages-list'

interface StudentDetailsModalProps {
  studentId: string | null
  isOpen: boolean
  onClose: () => void
}

interface StudentDetails {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt: Date
  financialBreakdown: {
    totalSpent: number
    totalRefunded: number
    netSpent: number
  }
  appointmentCounts: {
    upcoming: number
    past: number
    cancelled: number
    total: number
  }
  messageCount: number
}

export function StudentDetailsModal({ studentId, isOpen, onClose }: StudentDetailsModalProps) {
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentDetails()
    }
  }, [isOpen, studentId])

  const fetchStudentDetails = async () => {
    if (!studentId) return

    setLoading(true)
    setError(null)

    try {
      const result = await getStudentDetails(studentId)
      if (result.success && result.data) {
        setStudent(result.data)
      } else {
        setError(result.error || 'Erreur lors du chargement des détails')
      }
    } catch (error) {
      console.error('Error fetching student details:', error)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

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

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] w-[95vw] max-w-none sm:w-full sm:max-w-6xl flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {student ? `${student.firstName} ${student.lastName}` : 'Détails de l\'étudiant'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="text-center text-muted-foreground">
                Chargement des détails...
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="text-center text-destructive">
                {error}
              </div>
            </div>
          ) : student ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-5 mx-6 mt-4 flex-shrink-0">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
                <TabsTrigger value="orders">Commandes</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 overflow-hidden">
                <TabsContent value="overview" className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {/* Profile Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informations du profil
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Téléphone</p>
                              <p className="text-sm text-muted-foreground">{student.phone}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Membre depuis</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(student.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Résumé financier
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-success-light rounded-lg">
                          <p className="text-sm text-muted-foreground">Total dépensé</p>
                          <p className="text-2xl font-bold text-success">
                            {formatCurrency(student.financialBreakdown.totalSpent)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-error-light rounded-lg">
                          <p className="text-sm text-muted-foreground">Total remboursé</p>
                          <p className="text-2xl font-bold text-error">
                            -{formatCurrency(student.financialBreakdown.totalRefunded)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Net dépensé</p>
                          <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(student.financialBreakdown.netSpent)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Rendez-vous
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-info" />
                              <span className="text-sm text-muted-foreground">À venir</span>
                            </div>
                            <p className="text-2xl font-bold">{student.appointmentCounts.upcoming}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-success" />
                              <span className="text-sm text-muted-foreground">Terminés</span>
                            </div>
                            <p className="text-2xl font-bold">{student.appointmentCounts.past}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <XCircle className="h-4 w-4 text-error" />
                              <span className="text-sm text-muted-foreground">Annulés</span>
                            </div>
                            <p className="text-2xl font-bold">{student.appointmentCounts.cancelled}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Total</span>
                            </div>
                            <p className="text-2xl font-bold">{student.appointmentCounts.total}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Messages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <p className="text-3xl font-bold mb-2">{student.messageCount}</p>
                          <p className="text-sm text-muted-foreground">Messages échangés</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="appointments" className="h-full overflow-hidden">
                  {studentId && <StudentAppointmentsList studentId={studentId} />}
                </TabsContent>

                <TabsContent value="orders" className="h-full overflow-hidden">
                  {studentId && <StudentOrdersList studentId={studentId} />}
                </TabsContent>

                <TabsContent value="messages" className="h-full overflow-hidden">
                  {studentId && <StudentMessagesList studentId={studentId} />}
                </TabsContent>

                <TabsContent value="support" className="h-full overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        Tickets de support
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Le système de tickets de support sera bientôt disponible.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Vous pourrez voir ici tous les tickets créés par cet étudiant.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
