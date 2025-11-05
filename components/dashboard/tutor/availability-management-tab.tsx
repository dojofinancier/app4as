'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Copy, Trash2, Edit, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  getTutorAvailabilityRules, 
  getTutorAvailabilityExceptions,
  saveAvailabilityRules,
  saveAvailabilityExceptions,
  type AvailabilityRule,
  type AvailabilityException
} from '@/lib/actions/availability'


interface AvailabilityManagementTabProps {
  tutorId: string
}

const WEEKDAYS = [
  { id: 0, name: 'Dimanche', short: 'Dim' },
  { id: 1, name: 'Lundi', short: 'Lun' },
  { id: 2, name: 'Mardi', short: 'Mar' },
  { id: 3, name: 'Mercredi', short: 'Mer' },
  { id: 4, name: 'Jeudi', short: 'Jeu' },
  { id: 5, name: 'Vendredi', short: 'Ven' },
  { id: 6, name: 'Samedi', short: 'Sam' }
]

// Generate 30-minute time slots in 24-hour format
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = (i % 2) * 30
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

// Custom Time Selector Component
interface TimeSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

function TimeSelector({ value, onChange, className }: TimeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    >
      {TIME_SLOTS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  )
}

export function AvailabilityManagementTab({ tutorId }: AvailabilityManagementTabProps) {
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([])
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load availability data
  useEffect(() => {
    loadAvailabilityData()
  }, [tutorId])

  const loadAvailabilityData = async () => {
    try {
      setLoading(true)
      const [rules, exceptions] = await Promise.all([
        getTutorAvailabilityRules(tutorId),
        getTutorAvailabilityExceptions(tutorId)
      ])
      setAvailabilityRules(rules)
      setExceptions(exceptions)
    } catch (err) {
      setError('Erreur lors du chargement des disponibilités')
      console.error('Error loading availability:', err)
    } finally {
      setLoading(false)
    }
  }

  const addTimeSlot = (weekday: number) => {
    const newRule: AvailabilityRule = {
      id: `temp-${Date.now()}`,
      tutorId,
      weekday,
      startTime: '09:00',
      endTime: '17:00'
    }
    setAvailabilityRules(prev => [...prev, newRule])
  }

  const removeTimeSlot = (ruleId: string) => {
    setAvailabilityRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  const updateTimeSlot = (ruleId: string, field: 'startTime' | 'endTime', value: string) => {
    setAvailabilityRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
    )
  }

  const copyTimeSlot = (ruleId: string) => {
    const rule = availabilityRules.find(r => r.id === ruleId)
    if (rule) {
      const newRule: AvailabilityRule = {
        id: `temp-${Date.now()}`,
        tutorId,
        weekday: rule.weekday,
        startTime: rule.startTime,
        endTime: rule.endTime
      }
      setAvailabilityRules(prev => [...prev, newRule])
    }
  }

  const addException = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const newException: AvailabilityException = {
      id: `temp-${Date.now()}`,
      tutorId,
      startDate: format(tomorrow, 'yyyy-MM-dd'),
      endDate: format(tomorrow, 'yyyy-MM-dd'),
      isUnavailable: true
    }
    setExceptions(prev => [...prev, newException])
  }

  const removeException = (exceptionId: string) => {
    setExceptions(prev => prev.filter(exp => exp.id !== exceptionId))
  }

  const updateException = (exceptionId: string, field: 'startDate' | 'endDate', value: string) => {
    setExceptions(prev => 
      prev.map(exp => 
        exp.id === exceptionId ? { ...exp, [field]: value } : exp
      )
    )
  }

  const saveAvailability = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Save availability rules
      const rulesResult = await saveAvailabilityRules(
        tutorId, 
        availabilityRules.map(rule => ({
          tutorId: rule.tutorId,
          weekday: rule.weekday,
          startTime: rule.startTime,
          endTime: rule.endTime
        }))
      )
      
      if (!rulesResult.success) {
        setError(rulesResult.error || 'Erreur lors de la sauvegarde des disponibilités')
        return
      }
      
      // Save exceptions
      const exceptionsResult = await saveAvailabilityExceptions(
        tutorId,
        exceptions.map(exception => ({
          tutorId: exception.tutorId,
          startDate: exception.startDate,
          endDate: exception.endDate,
          isUnavailable: exception.isUnavailable
        }))
      )
      
      if (!exceptionsResult.success) {
        setError(exceptionsResult.error || 'Erreur lors de la sauvegarde des exceptions')
        return
      }
      
      // Reload data to get updated IDs
      await loadAvailabilityData()
      
    } catch (err) {
      setError('Erreur lors de la sauvegarde des disponibilités')
      console.error('Error saving availability:', err)
    } finally {
      setSaving(false)
    }
  }

  const getTimeSlotsForDay = (weekday: number) => {
    return availabilityRules.filter(rule => rule.weekday === weekday)
  }

  const formatTimeSlot = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`
  }

  const getSummaryText = () => {
    const activeDays = WEEKDAYS.filter(day => 
      availabilityRules.some(rule => rule.weekday === day.id)
    )
    
    if (activeDays.length === 0) {
      return 'Aucune disponibilité définie'
    }
    
    const dayNames = activeDays.map(day => day.short.toLowerCase()).join(', ')
    const timeSlots = activeDays.map(day => {
      const slots = getTimeSlotsForDay(day.id)
      return slots.map(slot => formatTimeSlot(slot.startTime, slot.endTime)).join(', ')
    }).join(' ')
    
    return `${dayNames}, ${timeSlots}`
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestion des disponibilités</h2>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Gestion des disponibilités</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Définissez vos heures de disponibilité récurrentes et vos exceptions
          </p>
        </div>
        <Button onClick={saveAvailability} disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      {error && (
        <div className="bg-error-light border border-error-border rounded-lg p-4">
          <p className="text-error">{error}</p>
        </div>
      )}

      {/* Weekly Availability Template */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Disponibilités récurrentes
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Définissez vos heures de disponibilité pour chaque jour de la semaine
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm w-full sm:w-auto">
              {getSummaryText()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {WEEKDAYS.map((day) => {
            const daySlots = getTimeSlotsForDay(day.id)
            const isEnabled = daySlots.length > 0
            
            return (
              <div key={day.id} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          addTimeSlot(day.id)
                        } else {
                          setAvailabilityRules(prev => 
                            prev.filter(rule => rule.weekday !== day.id)
                          )
                        }
                      }}
                    />
                    <Label className="text-sm sm:text-base font-medium">
                      {day.name}
                    </Label>
                  </div>
                  {isEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(day.id)}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  )}
                </div>

                {isEnabled && (
                  <div className="ml-0 sm:ml-8 space-y-2">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TimeSelector
                              value={slot.startTime}
                              onChange={(value) => updateTimeSlot(slot.id, 'startTime', value)}
                              className="flex-1 min-w-0"
                            />
                            <span className="text-muted-foreground flex-shrink-0">-</span>
                            <TimeSelector
                              value={slot.endTime}
                              onChange={(value) => updateTimeSlot(slot.id, 'endTime', value)}
                              className="flex-1 min-w-0"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTimeSlot(slot.id)}
                            className="flex-1 sm:flex-initial"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(slot.id)}
                            className="flex-1 sm:flex-initial"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Separator />

      {/* Exceptions Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Exceptions de dates
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Ajoutez les dates où vos disponibilités changent de vos heures quotidiennes
              </CardDescription>
            </div>
            <Button variant="outline" onClick={addException} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une exception
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucune exception définie
            </div>
          ) : (
            <div className="space-y-3">
              {exceptions.map((exception) => (
                <div key={exception.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                    <Badge variant={exception.isUnavailable ? 'destructive' : 'default'} className="w-full sm:w-auto justify-center sm:justify-start">
                      {exception.isUnavailable ? 'Indisponible' : 'Disponible'}
                    </Badge>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Input
                        type="date"
                        value={exception.startDate}
                        onChange={(e) => updateException(exception.id, 'startDate', e.target.value)}
                        className="w-full sm:w-40"
                      />
                      {exception.startDate !== exception.endDate && (
                        <>
                          <span className="text-muted-foreground flex-shrink-0">-</span>
                          <Input
                            type="date"
                            value={exception.endDate}
                            onChange={(e) => updateException(exception.id, 'endDate', e.target.value)}
                            className="w-full sm:w-40"
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeException(exception.id)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
