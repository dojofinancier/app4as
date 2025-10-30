'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { rescheduleAppointment, getAvailableRescheduleSlots } from '@/lib/actions/reservations'
import { formatDateTime } from '@/lib/utils'
import { Calendar, Clock } from 'lucide-react'

const rescheduleSchema = z.object({
  reason: z.string().min(10, 'Veuillez expliquer la raison du changement (minimum 10 caractères)'),
  selectedSlot: z.string().min(1, 'Veuillez sélectionner un créneau disponible')
})

type RescheduleFormData = z.infer<typeof rescheduleSchema>

interface RescheduleModalProps {
  appointment: any
}

export function RescheduleModal({ appointment }: RescheduleModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema)
  })

  const selectedSlot = watch('selectedSlot')

  const loadAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const slots = await getAvailableRescheduleSlots(appointment.id)
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error loading available slots:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const onSubmit = async (data: RescheduleFormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      // Find the selected slot
      const slot = availableSlots.find(s => s.startDatetime === data.selectedSlot)
      if (!slot) {
        setMessage({ type: 'error', text: 'Créneau sélectionné non trouvé' })
        return
      }

      // Calculate new start and end datetime
      const newStartDatetime = new Date(slot.startDatetime)
      const endDatetime = new Date(appointment.endDatetime)
      const startDatetime = new Date(appointment.startDatetime)
      const duration = endDatetime.getTime() - startDatetime.getTime()
      const newEndDatetime = new Date(newStartDatetime.getTime() + duration)

      const result = await rescheduleAppointment({
        appointmentId: appointment.id,
        newStartDatetime,
        newEndDatetime,
        reason: data.reason
      })

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Rendez-vous reprogrammé avec succès'
        })
        reset()
        setTimeout(() => {
          setIsOpen(false)
          window.location.reload() // Refresh to show updated data
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la reprogrammation' })
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      setMessage({ type: 'error', text: 'Une erreur inattendue est survenue' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          setIsOpen(true)
          loadAvailableSlots()
        }}
      >
        Reprogrammer
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Calendar className="h-5 w-5" />
            Reprogrammer le rendez-vous
          </CardTitle>
          <CardDescription>
            Choisissez une nouvelle date et heure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Appointment Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">{appointment.course.titleFr}</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Tuteur: {appointment.tutor.user.firstName} {appointment.tutor.user.lastName}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <strong>Actuel:</strong> {formatDateTime(new Date(appointment.startDatetime))}
            </p>
            <p className="text-sm text-muted-foreground">
              Durée: {Math.round((new Date(appointment.endDatetime).getTime() - new Date(appointment.startDatetime).getTime()) / (1000 * 60))} minutes
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Available Slots */}
            <div className="space-y-2">
              <Label>Créneaux disponibles *</Label>
              {loadingSlots ? (
                <div className="p-4 text-center text-muted-foreground">
                  Chargement des créneaux disponibles...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Aucun créneau disponible pour la reprogrammation
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableSlots.map((slot) => (
                    <label
                      key={slot.startDatetime}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        value={slot.startDatetime}
                        {...register('selectedSlot')}
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {new Date(slot.startDatetime).toLocaleDateString('fr-CA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {slot.displayTime}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {errors.selectedSlot && (
                <p className="text-sm text-red-600">{errors.selectedSlot.message}</p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du changement *</Label>
              <Input
                id="reason"
                {...register('reason')}
                placeholder="Expliquez pourquoi vous reprogrammez ce rendez-vous..."
                disabled={isSubmitting}
              />
              {errors.reason && (
                <p className="text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important :</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Seuls les créneaux disponibles sont affichés</li>
                    <li>• Même tuteur et même cours</li>
                    <li>• Même durée que le rendez-vous original</li>
                    <li>• Le tuteur sera notifié du changement</li>
                    <li>• Reprogrammation possible jusqu'à 2h avant le rendez-vous</li>
                  </ul>
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Reprogrammation...' : 'Confirmer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
