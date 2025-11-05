'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, DollarSign } from 'lucide-react'

interface BookingTypeSelectorProps {
  tutor: {
    id: string
    displayName: string
    hourlyBaseRateCad: number
  }
  course: {
    id: string
    titleFr: string
    slug: string
  }
  selectedSlot: {
    start: Date
    end: Date
  }
  duration: number
  onSelectOneOff: () => void
}

export function BookingTypeSelector({
  tutor,
  course,
  selectedSlot,
  duration,
  onSelectOneOff,
}: BookingTypeSelectorProps) {
  const calculateOneOffPrice = () => {
    const multiplier = duration === 60 ? 1 : duration === 90 ? 1.5 : 2
    return Number(tutor.hourlyBaseRateCad) * multiplier
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type de réservation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Session Details */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {selectedSlot.start.toLocaleDateString('fr-CA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {selectedSlot.start.toLocaleTimeString('fr-CA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })} - {selectedSlot.end.toLocaleTimeString('fr-CA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Avec {tutor.displayName}</span>
            </div>
          </div>

          {/* Booking Options */}
          <div className="grid gap-4">
            {/* One-off Session */}
            <button
              onClick={onSelectOneOff}
              className="p-4 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Session unique</h3>
                    <p className="text-sm text-muted-foreground">
                      Une seule session de {duration === 60 ? '1 heure' : 
                       duration === 90 ? '1h30' : '2 heures'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {calculateOneOffPrice().toFixed(2)} $ CAD
                  </div>
                  <div className="text-sm text-muted-foreground">Paiement immédiat</div>
                </div>
              </div>
            </button>

          </div>

          {/* Info */}
          <div className="bg-info-light border border-info-border rounded-lg p-3">
            <p className="text-sm text-info">
              <strong>Note:</strong> Les sessions récurrentes vous permettent de réserver plusieurs sessions 
              à l'avance avec le même tuteur et le même horaire. Vous serez facturé pour toutes les sessions 
              immédiatement.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
