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
  adjustTutorEarnings, 
  markEarningsAsPaid, 
  getAllTutorEarnings,
  TutorEarningsData 
} from '@/lib/actions/tutor-earnings'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Edit3, DollarSign, Clock, Calendar, AlertCircle } from 'lucide-react'

export function TutorEarningsManagement() {
  const [earnings, setEarnings] = useState<TutorEarningsData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEarning, setSelectedEarning] = useState<TutorEarningsData | null>(null)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [filterTutor, setFilterTutor] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Form states
  const [hoursWorked, setHoursWorked] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [paidAt, setPaidAt] = useState('')

  useEffect(() => {
    loadEarnings()
  }, [])

  const loadEarnings = async () => {
    setLoading(true)
    try {
      const result = await getAllTutorEarnings()
      if (result.success) {
        setEarnings(result.data || [])
      } else {
        console.error('Error loading earnings:', result.error)
      }
    } catch (error) {
      console.error('Error loading earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustEarnings = async () => {
    if (!selectedEarning) return

    try {
      const result = await adjustTutorEarnings(
        selectedEarning.id,
        parseFloat(hoursWorked),
        adminNote || undefined
      )

      if (result.success) {
        setIsAdjustDialogOpen(false)
        setHoursWorked('')
        setAdminNote('')
        setSelectedEarning(null)
        loadEarnings()
        alert('Gains ajustés avec succès')
      } else {
        alert(result.error || 'Erreur lors de l\'ajustement des gains')
      }
    } catch (error) {
      console.error('Error adjusting earnings:', error)
      alert('Erreur lors de l\'ajustement des gains')
    }
  }

  const handleMarkAsPaid = async () => {
    if (!selectedEarning) return

    try {
      const result = await markEarningsAsPaid(
        selectedEarning.id,
        new Date(paidAt)
      )

      if (result.success) {
        setIsPaymentDialogOpen(false)
        setPaidAt('')
        setSelectedEarning(null)
        loadEarnings()
        alert('Gains marqués comme payés')
      } else {
        alert(result.error || 'Erreur lors du marquage du paiement')
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      alert('Erreur lors du marquage du paiement')
    }
  }

  const openAdjustDialog = (earning: TutorEarningsData) => {
    setSelectedEarning(earning)
    setHoursWorked(earning.hoursWorked?.toString() || (earning.durationMin / 60).toString())
    setAdminNote(earning.adminNote || '')
    setIsAdjustDialogOpen(true)
  }

  const openPaymentDialog = (earning: TutorEarningsData) => {
    setSelectedEarning(earning)
    setPaidAt(new Date().toISOString().split('T')[0])
    setIsPaymentDialogOpen(true)
  }

  const filteredEarnings = earnings.filter(earning => {
    const matchesTutor = filterTutor === 'all' || earning.tutorId === filterTutor
    const matchesStatus = filterStatus === 'all' || earning.earningsStatus === filterStatus
    const matchesSearch = searchTerm === '' || 
      earning.course.titleFr.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesTutor && matchesStatus && matchesSearch
  })

  const getUniqueTutors = () => {
    const tutors = new Map()
    earnings.forEach(earning => {
      if (!tutors.has(earning.tutorId)) {
        tutors.set(earning.tutorId, {
          id: earning.tutorId,
          name: `Tuteur ${earning.tutorId.slice(0, 8)}`
        })
      }
    })
    return Array.from(tutors.values())
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des gains des tuteurs</CardTitle>
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
          <CardTitle>Gestion des gains des tuteurs</CardTitle>
          <CardDescription>
            Ajustez les gains et marquez les paiements pour tous les tuteurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Rechercher par cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tutor-filter">Tuteur</Label>
              <Select value={filterTutor} onValueChange={setFilterTutor}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les tuteurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les tuteurs</SelectItem>
                  {getUniqueTutors().map(tutor => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="earned">Gagné</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadEarnings} variant="outline">
                Actualiser
              </Button>
            </div>
          </div>

          {/* Earnings Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tuteur</TableHead>
                  <TableHead>Cours</TableHead>
                  <TableHead>Heures</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Gains</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEarnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDateTime(earning.startDatetime)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        Tuteur {earning.tutorId.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {earning.course.titleFr}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {earning.hoursWorked?.toFixed(1) || (earning.durationMin / 60).toFixed(1)}h
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatCurrency(earning.rateAtTime || 0)}/h
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatCurrency(earning.tutorEarningsCad)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={earning.earningsStatus === 'paid' ? 'default' : 'secondary'}>
                        {earning.earningsStatus === 'paid' ? 'Payé' : 'Gagné'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustDialog(earning)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Ajuster
                        </Button>
                        {earning.earningsStatus === 'earned' && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog(earning)}
                          >
                            Marquer payé
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEarnings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun gain trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Earnings Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster les gains</DialogTitle>
            <DialogDescription>
              Modifiez les heures travaillées et ajoutez une note d'administration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEarning && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <strong>Cours:</strong> {selectedEarning.course.titleFr}
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Date:</strong> {formatDateTime(selectedEarning.startDatetime)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Durée prévue:</strong> {selectedEarning.durationMin} minutes
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="hours-worked">Heures travaillées</Label>
              <Input
                id="hours-worked"
                type="number"
                step="0.1"
                min="0"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="Ex: 1.5"
              />
            </div>
            <div>
              <Label htmlFor="admin-note">Note d'administration</Label>
              <Textarea
                id="admin-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Expliquez la raison de l'ajustement..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdjustEarnings}>
              Ajuster les gains
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme payé</DialogTitle>
            <DialogDescription>
              Définissez la date de paiement pour ces gains
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEarning && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <strong>Cours:</strong> {selectedEarning.course.titleFr}
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Montant:</strong> {formatCurrency(selectedEarning.tutorEarningsCad)}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="paid-at">Date de paiement</Label>
              <Input
                id="paid-at"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleMarkAsPaid}>
              Marquer comme payé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
