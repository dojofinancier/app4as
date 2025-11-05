'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Edit, UserX, Mail, Phone, Calendar, Clock, DollarSign, Star } from 'lucide-react'
import { createTutorAccount, getAllTutors, updateTutorProfile, deactivateTutor, getTutorUtilization, getTutorEarningsSummary, getTutorAppointmentsCountThisMonth } from '@/lib/actions/admin'
import { getTutorRatingAverages } from '@/lib/actions/ratings'
import { TutorAvailabilityModal } from './tutor-availability-modal'
import { TutorPaymentsModal } from './tutor-payments-modal'
import { TutorRatingsModal } from './tutor-ratings-modal'

interface Tutor {
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
    createdAt: Date
  }
  tutorCourses: Array<{
    course: {
      id: string
      titleFr: string
      slug: string
    }
  }>
  availabilityRules: Array<{
    id: string
    weekday: number
    startTime: string
    endTime: string
  }>
  _count: {
    appointments: number
  }
  utilization?: {
    utilization: number
    totalAvailableSlots: number
    bookedSlots: number
    period: string
  }
  earnings?: {
    currentMonth: {
      earned: number
      paid: number
      totalEarnings: number
      totalHours: number
      appointmentsCount: number
    }
    yearToDate: {
      earned: number
      paid: number
      totalEarnings: number
      totalHours: number
    }
  }
  appointmentsCountThisMonth?: number
  ratings?: {
    count: number
    avgGeneral: number
    avgQ1: number
    avgQ2: number
    avgQ3: number
    avgQ4: number
  }
}

export function TutorManagement() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [showPaymentsModal, setShowPaymentsModal] = useState(false)
  const [showRatingsModal, setShowRatingsModal] = useState(false)
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null)
  const [selectedTutorName, setSelectedTutorName] = useState<string>('')

  useEffect(() => {
    fetchTutors()
  }, [])

  const fetchTutors = async () => {
    try {
      const result = await getAllTutors()
      if (result.success && result.data) {
        const tutorsData = result.data as any[]
        
        // Load utilization, earnings, appointments count, and ratings for each tutor
        const tutorsWithStats = await Promise.all(
          tutorsData.map(async (tutor) => {
            const [utilizationResult, earningsResult, appointmentsCountResult, ratingsResult] = await Promise.all([
              getTutorUtilization(tutor.id),
              getTutorEarningsSummary(tutor.id),
              getTutorAppointmentsCountThisMonth(tutor.id),
              getTutorRatingAverages({ tutorId: tutor.id })
            ])
            
            return {
              ...tutor,
              utilization: utilizationResult.success ? utilizationResult.data : undefined,
              earnings: earningsResult.success ? earningsResult.data : undefined,
              appointmentsCountThisMonth: appointmentsCountResult.success ? appointmentsCountResult.data : 0,
              ratings: ratingsResult.success && ratingsResult.data ? ratingsResult.data : undefined,
            }
          })
        )
        
        setTutors(tutorsWithStats)
      } else {
        setError(result.error || 'Erreur lors du chargement des tuteurs')
      }
    } catch (error) {
      setError('Erreur lors du chargement des tuteurs')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAvailability = (tutor: Tutor) => {
    setSelectedTutorId(tutor.id)
    setSelectedTutorName(tutor.displayName)
    setShowAvailabilityModal(true)
  }

  const handleOpenPayments = (tutor: Tutor) => {
    setSelectedTutorId(tutor.id)
    setSelectedTutorName(tutor.displayName)
    setShowPaymentsModal(true)
  }

  const handleOpenRatings = (tutor: Tutor) => {
    setSelectedTutorId(tutor.id)
    setSelectedTutorName(tutor.displayName)
    setShowRatingsModal(true)
  }

  const handlePaymentMarked = () => {
    // Refresh tutor data after payment
    fetchTutors()
  }

  const handleDeactivateTutor = async (tutorId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver ce tuteur ?')) {
      return
    }

    try {
      const result = await deactivateTutor(tutorId)
      if (result.success) {
        await fetchTutors()
      } else {
        setError(result.error || 'Erreur lors de la désactivation du tuteur')
      }
    } catch (error) {
      setError('Erreur lors de la désactivation du tuteur')
    }
  }

  const handleEditTutor = (tutor: Tutor) => {
    setEditingTutor(tutor)
  }

  const handleUpdateTutor = async (tutorId: string, data: {
    displayName: string
    bioFr: string
    hourlyBaseRateCad: number
    priority: number
    active: boolean
  }) => {
    try {
      const result = await updateTutorProfile(tutorId, data)
      if (result.success) {
        setEditingTutor(null)
        await fetchTutors()
      } else {
        setError(result.error || 'Erreur lors de la mise à jour du tuteur')
      }
    } catch (error) {
      setError('Erreur lors de la mise à jour du tuteur')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestion des tuteurs</h2>
          <p className="text-muted-foreground">
            Gérez les comptes tuteurs et leurs profils
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau tuteur
        </Button>
      </div>

      {error && (
        <div className="bg-error-light border border-error-border rounded-md p-4">
          <p className="text-error">{error}</p>
        </div>
      )}

      {showCreateForm && (
        <CreateTutorForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchTutors()
          }}
        />
      )}

      {showPaymentsModal && selectedTutorId && (
        <TutorPaymentsModal
          tutorId={selectedTutorId}
          tutorName={selectedTutorName}
          isOpen={showPaymentsModal}
          onClose={() => {
            setShowPaymentsModal(false)
            setSelectedTutorId(null)
            setSelectedTutorName('')
          }}
          onPaymentMarked={handlePaymentMarked}
        />
      )}

      {showRatingsModal && selectedTutorId && (
        <TutorRatingsModal
          tutorId={selectedTutorId}
          tutorName={selectedTutorName}
          isOpen={showRatingsModal}
          onClose={() => {
            setShowRatingsModal(false)
            setSelectedTutorId(null)
            setSelectedTutorName('')
          }}
        />
      )}

      {showAvailabilityModal && selectedTutorId && (
        <TutorAvailabilityModal
          tutorId={selectedTutorId}
          tutorName={selectedTutorName}
          isOpen={showAvailabilityModal}
          onClose={() => {
            setShowAvailabilityModal(false)
            setSelectedTutorId(null)
            setSelectedTutorName('')
          }}
        />
      )}

      {editingTutor && (
        <EditTutorModal
          tutor={editingTutor}
          onClose={() => setEditingTutor(null)}
          onSave={handleUpdateTutor}
        />
      )}

      <div className="grid gap-6">
        {tutors.map((tutor) => (
          <Card key={tutor.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{tutor.displayName}</span>
                      <Badge variant={tutor.active ? "default" : "secondary"}>
                        {tutor.active ? "Actif" : "Inactif"}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {tutor.user.firstName} {tutor.user.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenAvailability(tutor)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Voir disponibilités
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenPayments(tutor)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Honoraires
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenRatings(tutor)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Évaluations
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditTutor(tutor)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  {tutor.active && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeactivateTutor(tutor.id)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Désactiver
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Info */}
                <div>
                  <h4 className="font-medium mb-2">Informations de contact</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{tutor.user.email}</span>
                    </div>
                    {tutor.user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{tutor.user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Inscrit le {formatDate(tutor.user.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div>
                  <h4 className="font-medium mb-2">Profil professionnel</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Tarif horaire:</strong> {formatCurrency(Number(tutor.hourlyBaseRateCad))}</p>
                    <p><strong>Priorité:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        tutor.priority === 0 ? 'bg-error-light text-error' :
                        tutor.priority >= 80 ? 'bg-success-light text-success' :
                        tutor.priority >= 50 ? 'bg-warning-light text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {tutor.priority === 0 ? 'Désactivé' : tutor.priority}
                      </span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <strong>Rendez-vous ce mois:</strong> {tutor.appointmentsCountThisMonth || 0}
                    </p>
                    {tutor.utilization && (
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <strong>Utilisation:</strong> {tutor.utilization.utilization.toFixed(1)}%
                      </p>
                    )}
                    {tutor.earnings && (
                      <>
                        <p className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <strong>Gains ce mois:</strong> {formatCurrency(tutor.earnings.currentMonth.totalEarnings)}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({formatCurrency(tutor.earnings.currentMonth.earned)} non payés)
                          </span>
                        </p>
                        <p className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <strong>Gains cumulés (année):</strong> {formatCurrency(tutor.earnings.yearToDate.totalEarnings)}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({formatCurrency(tutor.earnings.yearToDate.earned)} non payés)
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {tutor.bioFr}
                  </p>
                </div>

                {/* Courses & Rating */}
                <div>
                  <h4 className="font-medium mb-2">Cours enseignés</h4>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tutor.tutorCourses.map((tc) => (
                      <Badge key={tc.course.id} variant="outline" className="text-xs">
                        {tc.course.titleFr}
                      </Badge>
                    ))}
                  </div>
                  
                  <h4 className="font-medium mb-2">Évaluation</h4>
                  {tutor.ratings && tutor.ratings.count > 0 ? (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <span>{tutor.ratings.avgGeneral.toFixed(2)} / 5</span>
                      <span className="text-xs">({tutor.ratings.count} évaluation{tutor.ratings.count > 1 ? 's' : ''})</span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <span>À venir</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tutors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Aucun tuteur trouvé</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer le premier tuteur
          </Button>
        </div>
      )}
    </div>
  )
}

// Create Tutor Form Component
function CreateTutorForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    displayName: '',
    bioFr: '',
    hourlyBaseRateCad: 75,
    priority: 100,
    courseIds: [] as string[],
    availabilityRules: [
      { weekday: 1, startTime: '09:00', endTime: '17:00' },
      { weekday: 2, startTime: '09:00', endTime: '17:00' },
      { weekday: 3, startTime: '09:00', endTime: '17:00' },
      { weekday: 4, startTime: '09:00', endTime: '17:00' },
      { weekday: 5, startTime: '09:00', endTime: '17:00' },
    ],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createTutorAccount(formData)
      if (result.success) {
        // Show success message with the message from the server
        alert(result.message || 'Tuteur créé avec succès')
        onSuccess()
      } else {
        setError(result.error || 'Erreur')
      }
    } catch (error) {
      setError('Erreur lors de la création du tuteur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un nouveau tuteur</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-error-light border border-error-border rounded-md p-4">
              <p className="text-error">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="displayName">Nom d'affichage</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="bioFr">Biographie</Label>
            <textarea
              id="bioFr"
              className="w-full p-2 border rounded-md"
              rows={3}
              value={formData.bioFr}
              onChange={(e) => setFormData({ ...formData, bioFr: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hourlyBaseRateCad">Tarif horaire (CAD)</Label>
              <Input
                id="hourlyBaseRateCad"
                type="number"
                step="0.01"
                value={formData.hourlyBaseRateCad || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ 
                    ...formData, 
                    hourlyBaseRateCad: value === '' ? 0 : parseFloat(value) || 0 
                  })
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ 
                    ...formData, 
                    priority: value === '' ? 0 : parseInt(value) || 0 
                  })
                }}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le tuteur'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Edit Tutor Modal Component
function EditTutorModal({ 
  tutor, 
  onClose, 
  onSave 
}: { 
  tutor: Tutor
  onClose: () => void
  onSave: (tutorId: string, data: {
    displayName: string
    bioFr: string
    hourlyBaseRateCad: number
    priority: number
    active: boolean
  }) => void
}) {
  const [formData, setFormData] = useState({
    displayName: tutor.displayName,
    bioFr: tutor.bioFr,
    hourlyBaseRateCad: Number(tutor.hourlyBaseRateCad),
    priority: tutor.priority,
    active: tutor.active,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate priority range
      if (formData.priority < 0 || formData.priority > 100) {
        setError('La priorité doit être entre 0 et 100')
        setLoading(false)
        return
      }

      // Validate hourly rate
      if (formData.hourlyBaseRateCad <= 0) {
        setError('Le tarif horaire doit être supérieur à 0')
        setLoading(false)
        return
      }

      await onSave(tutor.id, formData)
    } catch (error) {
      setError('Erreur lors de la mise à jour du tuteur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Modifier le tuteur</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-error-light border border-error-border rounded-md p-4">
              <p className="text-error">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="displayName">Nom d'affichage</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="bioFr">Biographie</Label>
            <textarea
              id="bioFr"
              className="w-full p-2 border rounded-md"
              rows={3}
              value={formData.bioFr}
              onChange={(e) => setFormData({ ...formData, bioFr: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hourlyBaseRateCad">Tarif horaire (CAD)</Label>
              <Input
                id="hourlyBaseRateCad"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyBaseRateCad || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ 
                    ...formData, 
                    hourlyBaseRateCad: value === '' ? 0 : parseFloat(value) || 0 
                  })
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Priorité (0-100)</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="100"
                value={formData.priority || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ 
                    ...formData, 
                    priority: value === '' ? 0 : parseInt(value) || 0 
                  })
                }}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = Désactivé, 100 = Priorité maximale
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            />
            <Label htmlFor="active">Tuteur actif</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

