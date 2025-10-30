'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getTutorAvailabilityForAdmin } from '@/lib/actions/admin'
import { Calendar, Clock, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const WEEKDAYS = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
]

interface AvailabilityRule {
  id: string
  weekday: number
  startTime: string
  endTime: string
}

interface AvailabilityException {
  id: string
  startDate: Date | null
  endDate: Date | null
  isUnavailable: boolean | null
}

interface TimeOff {
  id: string
  startDatetime: Date
  endDatetime: Date
}

interface TutorAvailabilityModalProps {
  tutorId: string
  tutorName: string
  isOpen: boolean
  onClose: () => void
}

export function TutorAvailabilityModal({
  tutorId,
  tutorName,
  isOpen,
  onClose,
}: TutorAvailabilityModalProps) {
  const [loading, setLoading] = useState(true)
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && tutorId) {
      loadAvailability()
    }
  }, [isOpen, tutorId])

  const loadAvailability = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getTutorAvailabilityForAdmin(tutorId)
      if (result.success && result.data) {
        setRules(result.data.rules || [])
        setExceptions(result.data.exceptions || [])
        setTimeOffs(result.data.timeOffs || [])
      } else {
        setError(result.error || 'Erreur lors du chargement des disponibilités')
      }
    } catch (error) {
      setError('Erreur lors du chargement des disponibilités')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Disponibilités - {tutorName}</DialogTitle>
          <DialogDescription>
            Affiche les règles de disponibilité récurrentes, les exceptions et les périodes de congé
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recurring Rules */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Règles récurrentes
              </h3>
              {rules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune règle récurrente définie</p>
              ) : (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Jour</th>
                        <th className="text-left p-3 text-sm font-medium">Heure de début</th>
                        <th className="text-left p-3 text-sm font-medium">Heure de fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule.id} className="border-t">
                          <td className="p-3 text-sm">{WEEKDAYS[rule.weekday]}</td>
                          <td className="p-3 text-sm">{rule.startTime}</td>
                          <td className="p-3 text-sm">{rule.endTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Availability Exceptions */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <X className="h-5 w-5" />
                Exceptions de disponibilité
              </h3>
              {exceptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune exception définie</p>
              ) : (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Date de début</th>
                        <th className="text-left p-3 text-sm font-medium">Date de fin</th>
                        <th className="text-left p-3 text-sm font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exceptions.map((exception) => (
                        <tr key={exception.id} className="border-t">
                          <td className="p-3 text-sm">
                            {exception.startDate ? formatDate(exception.startDate) : '-'}
                          </td>
                          <td className="p-3 text-sm">
                            {exception.endDate ? formatDate(exception.endDate) : '-'}
                          </td>
                          <td className="p-3">
                            <Badge variant={exception.isUnavailable ? 'destructive' : 'default'}>
                              {exception.isUnavailable ? 'Indisponible' : 'Disponible'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Time Off */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Congés
              </h3>
              {timeOffs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun congé défini</p>
              ) : (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Date/heure de début</th>
                        <th className="text-left p-3 text-sm font-medium">Date/heure de fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeOffs.map((timeOff) => (
                        <tr key={timeOff.id} className="border-t">
                          <td className="p-3 text-sm">
                            {formatDate(timeOff.startDatetime)}
                          </td>
                          <td className="p-3 text-sm">
                            {formatDate(timeOff.endDatetime)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


