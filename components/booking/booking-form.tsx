'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Clock, User, DollarSign } from 'lucide-react'

interface BookingFormProps {
  selectedSlot: TimeSlot | null
  selectedTutor: Tutor | null
  selectedDuration: number
  onBookingSubmit: () => void
  onRecurringBookingSubmit?: () => void
}

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  duration: number
}

interface Tutor {
  id: string
  displayName: string
  bioFr: string
  hourlyBaseRateCad: number
}

export function BookingForm({
  selectedSlot,
  selectedTutor,
  selectedDuration,
  onBookingSubmit,
  onRecurringBookingSubmit
}: BookingFormProps) {
  if (!selectedSlot || !selectedTutor) {
    return null
  }

  const calculatePrice = () => {
    const multiplier = selectedDuration === 60 ? 1 : selectedDuration === 90 ? 1.5 : 2
    return selectedTutor.hourlyBaseRateCad * multiplier
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Résumé de la réservation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tutor Info */}
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{selectedTutor.displayName}</p>
            <p className="text-sm text-muted-foreground">Tutrice</p>
          </div>
        </div>

        {/* Date and Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {selectedSlot.start.toLocaleDateString('fr-CA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedSlot.start.toLocaleTimeString('fr-CA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })} - {selectedSlot.end.toLocaleTimeString('fr-CA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {selectedDuration === 60 ? '1 heure' : 
               selectedDuration === 90 ? '1h30' : '2 heures'}
            </p>
            <p className="text-sm text-muted-foreground">Durée</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Total</span>
          </div>
          <span className="text-xl font-bold">
            {formatCurrency(calculatePrice())}
          </span>
        </div>

        {/* Booking Options */}
        <div className="space-y-3">
          <Button onClick={onBookingSubmit} className="w-full" size="lg">
            Session unique - Continuer vers le paiement
          </Button>
          
          {onRecurringBookingSubmit && (
            <Button 
              onClick={onRecurringBookingSubmit} 
              variant="outline" 
              className="w-full" 
              size="lg"
            >
              Sessions récurrentes - Réserver plus de séances
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Réservation sécurisée avec Stripe</p>
          <p>• Annulation gratuite jusqu'à 2h avant</p>
          <p>• Confirmation par email</p>
        </div>
      </CardContent>
    </Card>
  )
}
