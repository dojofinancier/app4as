'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Clock, User, DollarSign, Plus, ShoppingCart, X } from 'lucide-react'
import { CalendarBooking } from './calendar-booking'

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
  hourlyBaseRateCad: any // Decimal from Prisma
}

interface Course {
  id: string
  titleFr: string
  slug: string
  studentRateCad: any // Decimal from Prisma
}

interface SessionSelectionProps {
  course: Course
  tutors: Tutor[]
  selectedDuration: number
  onSessionsSelected: (sessions: TimeSlot[]) => void
}

export function SessionSelection({
  course,
  tutors,
  selectedDuration,
  onSessionsSelected
}: SessionSelectionProps) {
  const [selectedSessions, setSelectedSessions] = useState<TimeSlot[]>([])
  const [selectedTutorId, setSelectedTutorId] = useState(tutors[0]?.id || '')

  const selectedTutor = tutors.find(t => t.id === selectedTutorId) || null

  const calculatePrice = (duration: number) => {
    if (!selectedTutor) return 0
    const multiplier = duration === 60 ? 1 : duration === 90 ? 1.5 : 2
    return course.studentRateCad * multiplier
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    // Check if this slot is already selected
    const isAlreadySelected = selectedSessions.some(session => 
      session.start.getTime() === slot.start.getTime() &&
      session.end.getTime() === slot.end.getTime()
    )

    if (isAlreadySelected) {
      return // Don't add duplicate slots
    }

    // Add the slot to selected sessions
    const newSessions = [...selectedSessions, slot]
    setSelectedSessions(newSessions)
  }

  const removeSession = (index: number) => {
    const newSessions = selectedSessions.filter((_, i) => i !== index)
    setSelectedSessions(newSessions)
  }

  const handleContinueToCart = () => {
    onSessionsSelected(selectedSessions)
  }

  const totalPrice = selectedSessions.reduce((sum, session) => 
    sum + calculatePrice(session.duration), 0
  )

  return (
    <div className="space-y-6">
      {/* Tutor Selection */}
      {tutors.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Choisir un tuteur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tutors.map((tutor) => (
                <Button
                  key={tutor.id}
                  variant={selectedTutorId === tutor.id ? "default" : "outline"}
                  onClick={() => setSelectedTutorId(tutor.id)}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                >
                  <div className="font-medium">{tutor.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(calculatePrice(selectedDuration))} / session
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar for Slot Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sélectionner vos créneaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarBooking
            courseId={course.id}
            tutorId={selectedTutorId}
            selectedDuration={selectedDuration}
            onSlotSelect={handleSlotSelect}
          />
        </CardContent>
      </Card>

      {/* Selected Sessions Summary */}
      {selectedSessions.length > 0 && (
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sessions sélectionnées ({selectedSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Sessions List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {session.start.toLocaleDateString('fr-CA', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.start.toLocaleTimeString('fr-CA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {session.end.toLocaleTimeString('fr-CA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.duration === 60 ? '1h' : 
                       session.duration === 90 ? '1h30' : '2h'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatCurrency(calculatePrice(session.duration))}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSession(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Price */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Total</span>
              </div>
              <span className="text-xl font-bold">
                {formatCurrency(totalPrice)}
              </span>
            </div>

            {/* Continue to Cart Button */}
            <Button onClick={handleContinueToCart} className="w-full" size="lg">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Continuer vers le panier ({selectedSessions.length} sessions)
            </Button>

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Vous pouvez ajouter plus de sessions en continuant la sélection</p>
              <p>• Annulation gratuite jusqu'à 2h avant chaque session</p>
              <p>• Paiement sécurisé avec Stripe</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
