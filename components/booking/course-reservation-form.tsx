'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Clock, User, DollarSign, Calendar } from 'lucide-react'
import { CalendarBooking } from './calendar-booking'
import { BookingForm } from './booking-form'
import { RecurringSessionForm } from './recurring-session-form'

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

interface Course {
  id: string
  titleFr: string
  slug: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface CourseReservationFormProps {
  course: Course
  tutors: Tutor[]
  user: User | null
}

export function CourseReservationForm({ course, tutors, user }: CourseReservationFormProps) {
  const router = useRouter()
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedTutorId, setSelectedTutorId] = useState(tutors[0]?.id || '')
  const [showRecurringForm, setShowRecurringForm] = useState(false)

  const selectedTutor = tutors.find(t => t.id === selectedTutorId) || null

  const calculatePrice = () => {
    if (!selectedTutor) return 0
    const multiplier = selectedDuration === 60 ? 1 : selectedDuration === 90 ? 1.5 : 2
    return selectedTutor.hourlyBaseRateCad * multiplier
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    // For now, use the first available tutor
    // Later we can implement logic to select the best available tutor for this slot
    if (tutors.length > 0 && !selectedTutorId) {
      setSelectedTutorId(tutors[0].id)
    }
  }

  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration)
    setSelectedSlot(null) // Reset selection when duration changes
  }

  const handleBookingSubmit = async () => {
    if (!selectedSlot || !selectedTutor) return

    try {
      const response = await fetch('/api/booking-session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: selectedTutor.id,
          courseSlug: course.slug,
          slot: {
            start: selectedSlot.start.toISOString(),
            end: selectedSlot.end.toISOString()
          },
          duration: selectedDuration
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Booking session creation failed:', errorData)
        throw new Error(errorData.error || 'Erreur lors de la création de la session de réservation')
      }

      const { sessionId } = await response.json()
      
      // Redirect to checkout with session ID
      router.push(`/checkout?sessionId=${sessionId}`)
    } catch (error) {
      console.error('Error creating booking session:', error)
      alert(`Erreur: ${error.message}`)
    }
  }

  const handleRecurringBookingSubmit = () => {
    setShowRecurringForm(true)
  }

  const handleRecurringBooking = async (recurringData: {
    frequency: string
    totalSessions: number
  }) => {
    if (!selectedSlot || !selectedTutor) return

    try {
      const response = await fetch('/api/recurring-session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: selectedTutor.id,
          courseSlug: course.slug,
          slot: {
            start: selectedSlot.start.toISOString(),
            end: selectedSlot.end.toISOString()
          },
          duration: selectedDuration,
          frequency: recurringData.frequency,
          totalSessions: recurringData.totalSessions
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Recurring session creation failed:', errorData)
        throw new Error(errorData.error || 'Erreur lors de la création de la session récurrente')
      }

      const { sessionId, recurringSessionId } = await response.json()
      
      // Redirect to checkout with session ID and recurring session ID
      router.push(`/checkout?sessionId=${sessionId}&type=recurring&recurringSessionId=${recurringSessionId}`)
    } catch (error) {
      console.error('Error creating recurring session:', error)
      alert(`Erreur: ${error.message}`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Duration Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Durée de la séance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[60, 90, 120].map((duration) => (
              <Button
                key={duration}
                variant={selectedDuration === duration ? "default" : "outline"}
                onClick={() => handleDurationChange(duration)}
                className="flex flex-col items-center gap-2 p-4 h-auto"
              >
                <span className="font-medium">{duration} min</span>
                <span className="text-sm text-muted-foreground">
                  {tutors.length > 0 && formatCurrency(tutors[0].hourlyBaseRateCad * (duration === 60 ? 1 : duration === 90 ? 1.5 : 2))}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Calendar and Booking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Choisir un créneau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarBooking
            courseId={course.id}
            tutorId={tutors[0]?.id || ''} // Use first tutor for now, will be updated when slot is selected
            selectedDuration={selectedDuration}
            onSlotSelect={handleSlotSelect}
          />
        </CardContent>
      </Card>

      {/* Booking Summary and Actions */}
      {selectedSlot ? (
        showRecurringForm ? (
          <RecurringSessionForm
            tutor={selectedTutor || tutors[0]}
            course={course}
            selectedSlot={selectedSlot}
            duration={selectedDuration}
            onBook={handleRecurringBooking}
            onCancel={() => setShowRecurringForm(false)}
          />
        ) : (
          <BookingForm
            selectedSlot={selectedSlot}
            selectedTutor={selectedTutor || tutors[0]}
            selectedDuration={selectedDuration}
            onBookingSubmit={handleBookingSubmit}
            onRecurringBookingSubmit={handleRecurringBookingSubmit}
          />
        )
      ) : (
        tutors.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un créneau disponible pour continuer</p>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
