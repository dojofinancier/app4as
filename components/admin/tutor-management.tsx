'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Edit, Eye, UserCheck, UserX, Mail, Phone, Calendar } from 'lucide-react'
import { createTutorAccount, getAllTutors, updateTutorProfile, deactivateTutor } from '@/lib/actions/admin'

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
}

const WEEKDAYS = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
]

export function TutorManagement() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTutors()
  }, [])

  const fetchTutors = async () => {
    try {
      const result = await getAllTutors()
      if (result.success && result.data) {
        setTutors(result.data as any)
      } else {
        setError(result.error || 'Erreur lors du chargement des tuteurs')
      }
    } catch (error) {
      setError('Erreur lors du chargement des tuteurs')
    } finally {
      setLoading(false)
    }
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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
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
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                  <Button variant="outline" size="sm">
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
                    <p><strong>Priorité:</strong> {tutor.priority}</p>
                    <p><strong>Rendez-vous:</strong> {tutor._count.appointments}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {tutor.bioFr}
                  </p>
                </div>

                {/* Courses & Availability */}
                <div>
                  <h4 className="font-medium mb-2">Cours enseignés</h4>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tutor.tutorCourses.map((tc) => (
                      <Badge key={tc.course.id} variant="outline" className="text-xs">
                        {tc.course.titleFr}
                      </Badge>
                    ))}
                  </div>
                  
                  <h4 className="font-medium mb-2">Disponibilités</h4>
                  <div className="text-sm space-y-1">
                    {tutor.availabilityRules.slice(0, 3).map((rule) => (
                      <div key={rule.id}>
                        {WEEKDAYS[rule.weekday]}: {rule.startTime} - {rule.endTime}
                      </div>
                    ))}
                    {tutor.availabilityRules.length > 3 && (
                      <div className="text-muted-foreground">
                        +{tutor.availabilityRules.length - 3} autres créneaux
                      </div>
                    )}
                  </div>
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
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
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
                value={formData.hourlyBaseRateCad}
                onChange={(e) => setFormData({ ...formData, hourlyBaseRateCad: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
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

