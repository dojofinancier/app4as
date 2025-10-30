'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Calendar,
  Edit3,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react'
import { 
  getTutorEarnings, 
  getTutorMonthlyEarnings, 
  getTutorYearToDateEarnings,
  updateTutorNote,
  TutorEarningsData,
  MonthlyEarnings,
  YearToDateData
} from '@/lib/actions/tutor-earnings'
import { formatCurrency } from '@/lib/utils'
import { TutorPaymentsModal } from '@/components/admin/tutor-payments-modal'
import { getTutorProfile } from '@/lib/actions/tutor'

interface TutorEarningsDashboardProps {
  tutorId: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function TutorEarningsDashboard({ tutorId }: TutorEarningsDashboardProps) {
  const [earnings, setEarnings] = useState<TutorEarningsData[]>([])
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarnings[]>([])
  const [yearToDate, setYearToDate] = useState<YearToDateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [showPaymentsModal, setShowPaymentsModal] = useState(false)
  const [tutorName, setTutorName] = useState('')

  useEffect(() => {
    loadEarningsData()
    loadTutorName()
  }, [tutorId])

  const loadTutorName = async () => {
    try {
      const result = await getTutorProfile(tutorId)
      if (result.success && result.data) {
        setTutorName(result.data.displayName)
      }
    } catch (error) {
      console.error('Error loading tutor name:', error)
    }
  }

  const loadEarningsData = async () => {
    setLoading(true)
    try {
      const [earningsResult, monthlyResult, ytdResult] = await Promise.all([
        getTutorEarnings(tutorId),
        getTutorMonthlyEarnings(tutorId),
        getTutorYearToDateEarnings(tutorId)
      ])

      if (earningsResult.success) {
        setEarnings(earningsResult.data || [])
      }
      if (monthlyResult.success) {
        setMonthlyEarnings(monthlyResult.data || [])
      }
      if (ytdResult.success) {
        setYearToDate(ytdResult.data || null)
      }
    } catch (error) {
      console.error('Error loading earnings data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNote = async (orderItemId: string) => {
    try {
      const result = await updateTutorNote(orderItemId, noteText)
      if (result.success) {
        setEditingNote(null)
        setNoteText('')
        loadEarningsData()
      } else {
        alert(result.error || 'Erreur lors de la mise à jour de la note')
      }
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Erreur lors de la mise à jour de la note')
    }
  }

  const startEditingNote = (orderItemId: string, currentNote: string) => {
    setEditingNote(orderItemId)
    setNoteText(currentNote || '')
  }

  const cancelEditing = () => {
    setEditingNote(null)
    setNoteText('')
  }

  const getCurrentMonthData = () => {
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    return monthlyEarnings.find(month => month.month === currentMonth) || {
      month: currentMonth,
      year: currentDate.getFullYear(),
      hours: 0,
      earnings: 0,
      paidHours: 0,
      paidEarnings: 0
    }
  }

  const getLastMonthData = () => {
    const currentDate = new Date()
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
    return monthlyEarnings.find(month => month.month === lastMonthKey) || {
      month: lastMonthKey,
      year: lastMonth.getFullYear(),
      hours: 0,
      earnings: 0,
      paidHours: 0,
      paidEarnings: 0
    }
  }

  const currentMonth = getCurrentMonthData()
  const lastMonth = getLastMonthData()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payments Modal Button */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des honoraires</CardTitle>
          <CardDescription>
            Consultez vos rendez-vous non payés et l'historique des paiements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowPaymentsModal(true)} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Voir les détails des honoraires
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois-ci</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{currentMonth.hours.toFixed(1)}h</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{formatCurrency(currentMonth.earnings)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mois dernier</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{lastMonth.hours.toFixed(1)}h</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{formatCurrency(lastMonth.earnings)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Year to Date */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Année en cours</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{yearToDate?.totalHours.toFixed(1) || 0}h</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{formatCurrency(yearToDate?.totalEarnings || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Honoraires mensuels</CardTitle>
            <CardDescription>Évolution des honoraires au fil des mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyEarnings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-')
                    return `${month}/${year.slice(2)}`
                  }}
                />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                  name === 'earnings' ? 'Honoraires' : 'Honoraires payés'
                  ]}
                  labelFormatter={(value) => {
                    const [year, month] = value.split('-')
                    return `${month}/${year}`
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Honoraires"
                />
                <Line 
                  type="monotone" 
                  dataKey="paidEarnings" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Honoraires payés"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Heures travaillées</CardTitle>
            <CardDescription>Heures complétées par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyEarnings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-')
                    return `${month}/${year.slice(2)}`
                  }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}h`, 
                    name === 'hours' ? 'Heures' : 'Heures payées'
                  ]}
                  labelFormatter={(value) => {
                    const [year, month] = value.split('-')
                    return `${month}/${year}`
                  }}
                />
                <Bar dataKey="hours" fill="#8884d8" name="Heures" />
                <Bar dataKey="paidHours" fill="#82ca9d" name="Heures payées" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des honoraires</CardTitle>
          <CardDescription>Historique détaillé de tous vos rendez-vous</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {earnings.map((earning) => (
              <div key={earning.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{earning.course.titleFr}</span>
                      <Badge variant={earning.earningsStatus === 'paid' ? 'default' : 'secondary'}>
                        {earning.earningsStatus === 'paid' ? 'Payé' : 'Gagné'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(earning.startDatetime).toLocaleDateString('fr-CA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold">{formatCurrency(earning.tutorEarningsCad)}</div>
                    <div className="text-sm text-muted-foreground">
                      {earning.hoursWorked?.toFixed(1) || (earning.durationMin / 60).toFixed(1)}h
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {(earning.tutorNote || earning.adminNote) && (
                  <div className="space-y-2">
                    {earning.tutorNote && (
                      <div className="text-sm">
                        <span className="font-medium text-blue-600">Votre note:</span>
                        <p className="text-muted-foreground">{earning.tutorNote}</p>
                      </div>
                    )}
                    {earning.adminNote && (
                      <div className="text-sm">
                        <span className="font-medium text-orange-600">Note admin:</span>
                        <p className="text-muted-foreground">{earning.adminNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Note Button */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditingNote(earning.id, earning.tutorNote || '')}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {earning.tutorNote ? 'Modifier la note' : 'Ajouter une note'}
                  </Button>
                </div>

                {/* Edit Note Form */}
                {editingNote === earning.id && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor={`note-${earning.id}`}>Note (max 500 caractères)</Label>
                      <Textarea
                        id={`note-${earning.id}`}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Expliquez les circonstances de ce rendez-vous..."
                        maxLength={500}
                        rows={3}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {noteText.length}/500 caractères
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(earning.id)}
                        disabled={noteText.length > 500}
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Adjustment Info */}
                {earning.adjustedAt && (
                  <div className="text-xs text-muted-foreground">
                    Ajusté le {new Date(earning.adjustedAt).toLocaleDateString('fr-CA')}
                  </div>
                )}
              </div>
            ))}

            {earnings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun honoraire enregistré pour le moment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tutor Payments Modal */}
      <TutorPaymentsModal
        tutorId={tutorId}
        tutorName={tutorName || 'Moi'}
        isOpen={showPaymentsModal}
        onClose={() => setShowPaymentsModal(false)}
        readOnly={true}
        useTutorActions={true}
      />
    </div>
  )
}
