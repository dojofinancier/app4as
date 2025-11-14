'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign,
  Loader2,
  Eye,
  SortAsc,
  SortDesc,
  Plus
} from 'lucide-react'
import { getAllStudents, createStudentAccount } from '@/lib/actions/admin'
import { StudentDetailsModal } from './student-details-modal'

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt: Date
  totalSpent: number
  totalRefunded: number
  netSpent: number
}

type SortBy = 'name' | 'createdAt' | 'totalSpent'
type SortOrder = 'asc' | 'desc'

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchStudents = useCallback(async (cursor?: string, append = false) => {
    const loadingState = append ? setLoadingMore : setLoading
    loadingState(true)
    setError(null)

    try {
      const result = await getAllStudents({
        cursor,
        limit: 20,
        sortBy,
        sortOrder,
        search: searchTerm || undefined
      })

      if (result.success && result.data) {
        const newStudents = result.data.students.map(student => ({
          ...student,
          createdAt: new Date(student.createdAt)
        }))

        if (append) {
          setStudents(prev => [...prev, ...newStudents])
        } else {
          setStudents(newStudents)
        }

        setHasMore(result.data.hasMore)
        setNextCursor(result.data.nextCursor)
      } else {
        setError(result.error || 'Erreur lors du chargement des étudiants')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Une erreur est survenue')
    } finally {
      loadingState(false)
    }
  }, [sortBy, sortOrder, searchTerm])

  const loadMore = () => {
    if (hasMore && nextCursor && !loadingMore) {
      fetchStudents(nextCursor, true)
    }
  }

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      setStudents([])
      setNextCursor(null)
      setHasMore(true)
      fetchStudents()
    }, 500)

    setSearchTimeout(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchTerm, fetchStudents])

  // Load students on mount and when sort changes
  useEffect(() => {
    setStudents([])
    setNextCursor(null)
    setHasMore(true)
    fetchStudents()
  }, [sortBy, sortOrder])

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

  const handleSortChange = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: SortBy) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? 
      <SortAsc className="h-4 w-4" /> : 
      <SortDesc className="h-4 w-4" />
  }

  if (loading && students.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Chargement des étudiants...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestion des étudiants</h2>
          <p className="text-muted-foreground">
            Gérez les comptes étudiants
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau étudiant
        </Button>
      </div>

      {error && (
        <div className="bg-error-light border border-error-border rounded-md p-4">
          <p className="text-error">{error}</p>
        </div>
      )}

      {showCreateForm && (
        <CreateStudentForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            setStudents([])
            setNextCursor(null)
            setHasMore(true)
            fetchStudents()
          }}
        />
      )}

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trier par:</span>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('name')}
            className="flex items-center gap-2"
          >
            Nom {getSortIcon('name')}
          </Button>
          <Button
            variant={sortBy === 'createdAt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('createdAt')}
            className="flex items-center gap-2"
          >
            Date d'inscription {getSortIcon('createdAt')}
          </Button>
          <Button
            variant={sortBy === 'totalSpent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('totalSpent')}
            className="flex items-center gap-2"
          >
            Montant dépensé {getSortIcon('totalSpent')}
          </Button>
        </div>
      </div>

      {/* Students List */}
      {error ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun étudiant trouvé</p>
              <p className="text-sm">
                {searchTerm ? 'Aucun étudiant ne correspond à votre recherche.' : 'Aucun étudiant enregistré.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {student.firstName} {student.lastName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Inscrit le {formatDate(student.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Financial Summary */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Total dépensé:</span>
                      </div>
                      <div className="text-lg font-bold">
                        {formatCurrency(student.netSpent)}
                      </div>
                      {student.totalRefunded > 0 && (
                        <div className="text-xs text-muted-foreground">
                          (Remboursé: {formatCurrency(student.totalRefunded)})
                        </div>
                      )}
                    </div>


                    {/* View Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStudentId(student.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Voir détails
                    </Button>
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
                  Charger plus d'étudiants
                </Button>
              )}
            </div>
          )}

          {!hasMore && students.length > 0 && (
            <div className="text-center text-muted-foreground py-4 text-sm">
              Tous les étudiants ont été chargés
            </div>
          )}
        </div>
      )}

      {/* Student Details Modal */}
      <StudentDetailsModal
        studentId={selectedStudentId}
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  )
}

// Create Student Form Component
function CreateStudentForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createStudentAccount({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      })
      
      if (result.success) {
        alert(result.message || 'Étudiant créé avec succès')
        onSuccess()
      } else {
        setError(result.error || 'Erreur')
      }
    } catch (error) {
      setError('Erreur lors de la création de l\'étudiant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un nouvel étudiant</CardTitle>
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer l\'étudiant'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
