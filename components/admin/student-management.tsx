'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  SortDesc
} from 'lucide-react'
import { getAllStudents } from '@/lib/actions/admin'
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
