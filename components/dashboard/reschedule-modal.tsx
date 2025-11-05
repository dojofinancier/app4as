'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { rescheduleAppointment } from '@/lib/actions/reservations'
import { formatDateTime } from '@/lib/utils'
import { Calendar, Clock } from 'lucide-react'
import { CalendarBooking } from '@/components/booking/calendar-booking'

const rescheduleSchema = z.object({
  reason: z.string().min(10, 'Veuillez expliquer la raison du changement (minimum 10 caractères)')
})

type RescheduleFormData = z.infer<typeof rescheduleSchema>

interface RescheduleModalProps {
  appointment: any
}

export function RescheduleModal({ appointment }: RescheduleModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)

  // Calculate duration from appointment
  const startDatetime = new Date(appointment.startDatetime)
  const endDatetime = new Date(appointment.endDatetime)
  const durationMinutes = Math.round((endDatetime.getTime() - startDatetime.getTime()) / (1000 * 60))
  // Ensure duration is one of the valid values (60, 90, or 120)
  const selectedDuration = (durationMinutes === 60 || durationMinutes === 90 || durationMinutes === 120) 
    ? durationMinutes as 60 | 90 | 120 
    : 60 // Default to 60 if invalid

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema)
  })

  const handleSlotSelect = (slot: { start: Date; end: Date; duration: number; tutorId?: string }) => {
    setSelectedSlot({
      start: slot.start,
      end: slot.end
    })
  }

  const onSubmit = async (data: RescheduleFormData) => {
    if (!selectedSlot) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un créneau disponible' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await rescheduleAppointment({
        appointmentId: appointment.id,
        newStartDatetime: selectedSlot.start,
        newEndDatetime: selectedSlot.end,
        reason: data.reason
      })

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Rendez-vous reprogrammé avec succès'
        })
        reset()
        setSelectedSlot(null)
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsOpen(true)}
        >
          Reprogrammer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-info">
            <Calendar className="h-5 w-5" />
            Reprogrammer le rendez-vous
          </DialogTitle>
          <CardDescription>
            Choisissez une nouvelle date et heure
          </CardDescription>
        </DialogHeader>
        
        {/* Current Appointment Details */}
        <div className="p-4 bg-muted rounded-lg mb-6">
          <h3 className="font-medium mb-2">{appointment.course.titleFr}</h3>
          <p className="text-sm text-muted-foreground mb-1">
            Tuteur: {appointment.tutor.user.firstName} {appointment.tutor.user.lastName}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <strong>Actuel:</strong> {formatDateTime(new Date(appointment.startDatetime))}
          </p>
          <p className="text-sm text-muted-foreground">
            Durée: {durationMinutes} minutes
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Calendar Component */}
          <div className="space-y-2">
            <Label>Créneaux disponibles *</Label>
            <CalendarBooking
              courseId={appointment.courseId}
              selectedDuration={selectedDuration}
              onSlotSelect={handleSlotSelect}
              selectedTutorId={appointment.tutorId}
            />
            {!selectedSlot && (
              <p className="text-sm text-muted-foreground mt-2">
                Veuillez sélectionner un créneau dans le calendrier
              </p>
            )}
            {selectedSlot && (
              <div className="mt-4 p-3 bg-info-light border border-info-border rounded-lg">
                <p className="text-sm font-medium text-info mb-1">Créneau sélectionné:</p>
                <p className="text-sm text-info">
                  {formatDateTime(selectedSlot.start)}
                </p>
              </div>
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
              <p className="text-sm text-error">{errors.reason.message}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="p-3 bg-info-light border border-info-border rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
              <div className="text-sm text-info">
                <p className="font-medium mb-1">Important :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Seuls les créneaux disponibles sont affichés</li>
                  <li>• Même tuteur et même cours</li>
                  <li>• Même durée que le rendez-vous original ({durationMinutes} minutes)</li>
                  <li>• Le tuteur sera notifié du changement</li>
                  <li>• Reprogrammation possible jusqu'à 2h avant le rendez-vous</li>
                </ul>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-success-light text-success border border-success-border' 
                : 'bg-error-light text-error border border-error-border'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsOpen(false)
                setSelectedSlot(null)
                reset()
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedSlot}
              className="flex-1"
            >
              {isSubmitting ? 'Reprogrammation...' : 'Confirmer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
