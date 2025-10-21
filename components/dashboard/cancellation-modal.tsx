'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cancelAppointment } from '@/lib/actions/reservations'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { AlertTriangle, PiggyBank, DollarSign } from 'lucide-react'

const cancellationSchema = z.object({
  reason: z.string().min(10, 'Veuillez expliquer la raison de l\'annulation (minimum 10 caractères)'),
  action: z.enum(['credit', 'refund'], {
    required_error: 'Veuillez choisir une option'
  })
})

type CancellationFormData = z.infer<typeof cancellationSchema>

interface CancellationModalProps {
  appointment: any
}

export function CancellationModal({ appointment }: CancellationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<CancellationFormData>({
    resolver: zodResolver(cancellationSchema),
    defaultValues: {
      action: 'credit'
    }
  })

  const selectedAction = watch('action')

  const onSubmit = async (data: CancellationFormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await cancelAppointment({
        appointmentId: appointment.id,
        reason: data.reason,
        action: data.action
      })

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: data.action === 'credit' 
            ? 'Rendez-vous annulé. Le montant a été ajouté à votre banque d\'heures.'
            : 'Rendez-vous annulé. Votre demande de remboursement a été envoyée.'
        })
        reset()
        setTimeout(() => {
          setIsOpen(false)
          window.location.reload() // Refresh to show updated data
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de l\'annulation' })
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      setMessage({ type: 'error', text: 'Une erreur inattendue est survenue' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button 
        variant="destructive" 
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        Annuler
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Annuler le rendez-vous
          </CardTitle>
          <CardDescription>
            Cette action ne peut pas être annulée
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Appointment Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">{appointment.course.titleFr}</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Tuteur: {appointment.tutor.user.firstName} {appointment.tutor.user.lastName}
            </p>
          <p className="text-sm text-muted-foreground mb-1">
            {formatDateTime(new Date(appointment.startDatetime))}
          </p>
            <p className="text-sm font-medium">
              {appointment.orderItem ? formatCurrency(appointment.orderItem.lineTotalCad) : 'Prix non disponible'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Raison de l'annulation *</Label>
              <Input
                id="reason"
                {...register('reason')}
                placeholder="Expliquez pourquoi vous annulez ce rendez-vous..."
                disabled={isSubmitting}
              />
              {errors.reason && (
                <p className="text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>

            {/* Action Selection */}
            <div className="space-y-3">
              <Label>Que souhaitez-vous faire ? *</Label>
              
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="credit"
                    {...register('action')}
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Ajouter à ma banque d'heures</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Le montant sera ajouté à votre compte pour une utilisation future
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="refund"
                    {...register('action')}
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Demander un remboursement</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Une demande de remboursement sera envoyée à l'administrateur
                    </p>
                  </div>
                </label>
              </div>
              
              {errors.action && (
                <p className="text-sm text-red-600">{errors.action.message}</p>
              )}
            </div>

            {/* Selected Action Info */}
            {selectedAction && (
              <div className={`p-3 rounded-lg ${
                selectedAction === 'credit' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm ${
                  selectedAction === 'credit' ? 'text-green-800' : 'text-blue-800'
                }`}>
                  {selectedAction === 'credit' ? (
                    <>
                      <strong>Banque d'heures :</strong> {formatCurrency(appointment.orderItem.lineTotalCad)} sera ajouté à votre compte. 
                      Vous pourrez utiliser ce crédit pour réserver de nouveaux cours sans frais supplémentaires.
                    </>
                  ) : (
                    <>
                      <strong>Remboursement :</strong> Une demande de remboursement sera envoyée à l'administrateur. 
                      Le traitement peut prendre quelques jours ouvrables.
                    </>
                  )}
                </p>
              </div>
            )}

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
                variant="destructive"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Annulation...' : 'Confirmer l\'annulation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
