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
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseAnalytics,
  getCourseTutors,
  assignTutorsToCourse,
  updateTutorCourseStatus,
  bulkActivateCourses,
  CourseData,
  CourseAnalytics,
  TutorAssignment
} from '@/lib/actions/course-management'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  BarChart3, 
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  DollarSign,
  BookOpen,
  GraduationCap,
  Tag
} from 'lucide-react'

export function CourseManagement() {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false)
  const [isTutorsDialogOpen, setIsTutorsDialogOpen] = useState(false)
  const [isAddTutorDialogOpen, setIsAddTutorDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null)
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)
  const [tutors, setTutors] = useState<TutorAssignment[]>([])
  const [availableTutors, setAvailableTutors] = useState<any[]>([])
  const [selectedTutorIds, setSelectedTutorIds] = useState<string[]>([])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [institutionFilter, setInstitutionFilter] = useState('')
  const [domainFilter, setDomainFilter] = useState('')

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    titleFr: '',
    descriptionFr: '',
    institution: '',
    domain: '',
    studentRateCad: 45.00
  })

  useEffect(() => {
    loadCourses()
    loadAvailableTutors()
  }, [searchTerm, statusFilter, institutionFilter, domainFilter])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const result = await getAllCourses({
        search: searchTerm || undefined,
        status: statusFilter,
        institution: institutionFilter || undefined,
        domain: domainFilter || undefined
      })
      
      if (result.success) {
        setCourses(result.data || [])
      } else {
        console.error('Error loading courses:', result.error)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTutors = async () => {
    try {
      // Get all active tutors
      const response = await fetch('/api/admin/tutors')
      if (response.ok) {
        const data = await response.json()
        setAvailableTutors(data.tutors || [])
      }
    } catch (error) {
      console.error('Error loading tutors:', error)
    }
  }

  const handleCreateCourse = async () => {
    try {
      const result = await createCourse(formData)
      if (result.success) {
        setIsCreateDialogOpen(false)
        setFormData({
          code: '',
          titleFr: '',
          descriptionFr: '',
          institution: '',
          domain: '',
          studentRateCad: 45.00
        })
        loadCourses()
        alert('Cours créé avec succès')
      } else {
        alert(result.error || 'Erreur lors de la création du cours')
      }
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Erreur lors de la création du cours')
    }
  }

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return

    try {
      const result = await updateCourse(selectedCourse.id, formData)
      if (result.success) {
        setIsEditDialogOpen(false)
        setSelectedCourse(null)
        loadCourses()
        alert('Cours mis à jour avec succès')
      } else {
        alert(result.error || 'Erreur lors de la mise à jour du cours')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      alert('Erreur lors de la mise à jour du cours')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return

    try {
      const result = await deleteCourse(courseId)
      if (result.success) {
        loadCourses()
        alert('Cours supprimé avec succès')
      } else {
        alert(result.error || 'Erreur lors de la suppression du cours')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Erreur lors de la suppression du cours')
    }
  }

  const handleViewAnalytics = async (course: CourseData) => {
    setSelectedCourse(course)
    try {
      const result = await getCourseAnalytics(course.id)
      if (result.success) {
        setAnalytics(result.data || null)
        setIsAnalyticsDialogOpen(true)
      } else {
        alert(result.error || 'Erreur lors du chargement des analyses')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      alert('Erreur lors du chargement des analyses')
    }
  }

  const handleViewTutors = async (course: CourseData) => {
    setSelectedCourse(course)
    try {
      const result = await getCourseTutors(course.id)
      if (result.success) {
        setTutors(result.data || [])
        setIsTutorsDialogOpen(true)
      } else {
        alert(result.error || 'Erreur lors du chargement des tuteurs')
      }
    } catch (error) {
      console.error('Error loading tutors:', error)
      alert('Erreur lors du chargement des tuteurs')
    }
  }

  const handleAddTutors = async () => {
    if (!selectedCourse || selectedTutorIds.length === 0) return

    try {
      const result = await assignTutorsToCourse(selectedCourse.id, selectedTutorIds)
      if (result.success) {
        setIsAddTutorDialogOpen(false)
        setSelectedTutorIds([])
        // Reload tutors for the current course
        const tutorsResult = await getCourseTutors(selectedCourse.id)
        if (tutorsResult.success) {
          setTutors(tutorsResult.data || [])
        }
        alert(`${selectedTutorIds.length} tuteur(s) assigné(s) avec succès`)
      } else {
        alert(result.error || 'Erreur lors de l\'assignation des tuteurs')
      }
    } catch (error) {
      console.error('Error assigning tutors:', error)
      alert('Erreur lors de l\'assignation des tuteurs')
    }
  }

  const handleUpdateTutorStatus = async (tutorCourseId: string, status: string) => {
    try {
      const result = await updateTutorCourseStatus(tutorCourseId, status as any)
      if (result.success) {
        // Reload tutors for the current course
        if (selectedCourse) {
          const tutorsResult = await getCourseTutors(selectedCourse.id)
          if (tutorsResult.success) {
            setTutors(tutorsResult.data || [])
          }
        }
      } else {
        alert(result.error || 'Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Error updating tutor status:', error)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  const handleBulkActivate = async () => {
    if (selectedCourses.length === 0) return

    try {
      const result = await bulkActivateCourses(selectedCourses)
      if (result.success) {
        setSelectedCourses([])
        loadCourses()
        alert(`${selectedCourses.length} cours activés avec succès`)
      } else {
        alert(result.error || 'Erreur lors de l\'activation des cours')
      }
    } catch (error) {
      console.error('Error bulk activating courses:', error)
      alert('Erreur lors de l\'activation des cours')
    }
  }

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const selectAllCourses = () => {
    setSelectedCourses(courses.map(c => c.id))
  }

  const deselectAllCourses = () => {
    setSelectedCourses([])
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des cours</CardTitle>
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
              <CardTitle>Gestion des cours</CardTitle>
              <CardDescription>
                Créez et gérez les cours disponibles pour les étudiants
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau cours
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Code, titre, institution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Statut</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="institution-filter">Institution</Label>
              <Input
                id="institution-filter"
                placeholder="Filtrer par institution..."
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="domain-filter">Domaine</Label>
              <Input
                id="domain-filter"
                placeholder="Filtrer par domaine..."
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadCourses} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCourses.length > 0 && (
            <div className="flex items-center space-x-4 mb-4 p-4 bg-info-light rounded-lg">
              <span className="text-sm font-medium">
                {selectedCourses.length} cours sélectionné(s)
              </span>
              <Button size="sm" onClick={handleBulkActivate}>
                Activer sélectionnés
              </Button>
              <Button size="sm" variant="outline" onClick={deselectAllCourses}>
                Désélectionner tout
              </Button>
            </div>
          )}

          {/* Courses Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectedCourses.length === courses.length ? deselectAllCourses : selectAllCourses}
                    >
                      {selectedCourses.length === courses.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Taux étudiant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Réservations</TableHead>
                  <TableHead>Tuteurs</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCourseSelection(course.id)}
                      >
                        {selectedCourses.includes(course.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{course.code}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.titleFr}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {course.descriptionFr}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.institution && (
                        <div className="flex items-center space-x-1">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{course.institution}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {course.domain && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{course.domain}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatCurrency(course.studentRateCad)}/h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={course.active ? "default" : "secondary"}>
                        {course.active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{course._count?.appointments || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{course._count?.tutorCourses || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCourse(course)
                            setFormData({
                              code: course.code,
                              titleFr: course.titleFr,
                              descriptionFr: course.descriptionFr,
                              institution: course.institution || '',
                              domain: course.domain || '',
                              studentRateCad: course.studentRateCad
                            })
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAnalytics(course)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewTutors(course)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {courses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun cours trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau cours</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer un nouveau cours
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code du cours *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: MATH101"
              />
            </div>
            <div>
              <Label htmlFor="studentRateCad">Taux étudiant (CAD/h) *</Label>
              <Input
                id="studentRateCad"
                type="number"
                step="0.01"
                min="0"
                value={formData.studentRateCad}
                onChange={(e) => setFormData({ ...formData, studentRateCad: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="titleFr">Titre du cours (FR) *</Label>
              <Input
                id="titleFr"
                value={formData.titleFr}
                onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })}
                placeholder="Ex: Mathématiques 101"
              />
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Ex: UQAM"
              />
            </div>
            <div>
              <Label htmlFor="domain">Domaine</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="Ex: Mathématiques"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="descriptionFr">Description (FR) *</Label>
              <Textarea
                id="descriptionFr"
                value={formData.descriptionFr}
                onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                placeholder="Description du cours..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCourse}>
              Créer le cours
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le cours</DialogTitle>
            <DialogDescription>
              Modifiez les informations du cours
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-code">Code du cours *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: MATH101"
              />
            </div>
            <div>
              <Label htmlFor="edit-studentRateCad">Taux étudiant (CAD/h) *</Label>
              <Input
                id="edit-studentRateCad"
                type="number"
                step="0.01"
                min="0"
                value={formData.studentRateCad}
                onChange={(e) => setFormData({ ...formData, studentRateCad: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-titleFr">Titre du cours (FR) *</Label>
              <Input
                id="edit-titleFr"
                value={formData.titleFr}
                onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })}
                placeholder="Ex: Mathématiques 101"
              />
            </div>
            <div>
              <Label htmlFor="edit-institution">Institution</Label>
              <Input
                id="edit-institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Ex: UQAM"
              />
            </div>
            <div>
              <Label htmlFor="edit-domain">Domaine</Label>
              <Input
                id="edit-domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="Ex: Mathématiques"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-descriptionFr">Description (FR) *</Label>
              <Textarea
                id="edit-descriptionFr"
                value={formData.descriptionFr}
                onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                placeholder="Description du cours..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateCourse}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analyses du cours</DialogTitle>
            <DialogDescription>
              {selectedCourse?.titleFr} - {selectedCourse?.code}
            </DialogDescription>
          </DialogHeader>
          {analytics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Réservations totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalBookings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tuteurs assignés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.assignedTutors}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Revenus étudiants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.totalStudentRevenue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Coûts tuteurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.totalTutorCosts)}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Marge brute</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.grossMargin)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pourcentage de marge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.marginPercentage.toFixed(1)}%</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsAnalyticsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutors Dialog */}
      <Dialog open={isTutorsDialogOpen} onOpenChange={setIsTutorsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Tuteurs assignés</DialogTitle>
            <DialogDescription>
              {selectedCourse?.titleFr} - {selectedCourse?.code}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Tuteurs assignés ({tutors.length})</h3>
              <Button 
                onClick={() => {
                  loadAvailableTutors()
                  setIsAddTutorDialogOpen(true)
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter des tuteurs
              </Button>
            </div>
            
            {tutors.map((tutor) => (
              <div key={tutor.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{tutor.tutor.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {tutor.tutor.user.firstName} {tutor.tutor.user.lastName} - {tutor.tutor.user.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Assigné le {formatDate(tutor.assignedAt)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    tutor.status === 'approved' ? 'default' : 
                    tutor.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {tutor.status === 'approved' ? 'Approuvé' : 
                     tutor.status === 'pending' ? 'En attente' : 'Inactif'}
                  </Badge>
                  <Select
                    value={tutor.status}
                    onValueChange={(value: any) => {
                      handleUpdateTutorStatus(tutor.id, value)
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {tutors.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun tuteur assigné à ce cours</p>
                <Button 
                  onClick={() => {
                    loadAvailableTutors()
                    setIsAddTutorDialogOpen(true)
                  }}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assigner des tuteurs
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTutorsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tutors Dialog */}
      <Dialog open={isAddTutorDialogOpen} onOpenChange={setIsAddTutorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assigner des tuteurs</DialogTitle>
            <DialogDescription>
              Sélectionnez les tuteurs à assigner à {selectedCourse?.titleFr}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {availableTutors.map((tutor) => (
                <div key={tutor.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id={`tutor-${tutor.id}`}
                    checked={selectedTutorIds.includes(tutor.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTutorIds([...selectedTutorIds, tutor.id])
                      } else {
                        setSelectedTutorIds(selectedTutorIds.filter(id => id !== tutor.id))
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <label htmlFor={`tutor-${tutor.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{tutor.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {tutor.user.firstName} {tutor.user.lastName} - {tutor.user.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Taux: {formatCurrency(tutor.hourlyBaseRateCad)}/h
                    </div>
                  </label>
                </div>
              ))}
            </div>
            {availableTutors.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun tuteur disponible</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTutorDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddTutors}
              disabled={selectedTutorIds.length === 0}
            >
              Assigner {selectedTutorIds.length} tuteur(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
