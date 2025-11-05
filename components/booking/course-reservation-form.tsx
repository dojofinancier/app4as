'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'
import { SessionSelection } from './session-selection'

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  duration: number
  tutorId?: string // Add tutor information
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
  initialTutorId?: string
}

export function CourseReservationForm({ course, tutors, user: _user, initialTutorId }: CourseReservationFormProps) {
  const router = useRouter()
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [_selectedSessions, setSelectedSessions] = useState<TimeSlot[]>([])
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartStatus, setAddToCartStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  } | null>(null)

  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration)
    setSelectedSessions([]) // Reset selection when duration changes
    setAddToCartStatus(null) // Clear status when changing duration
  }

  const handleSessionsSelected = async (sessions: TimeSlot[]) => {
    if (sessions.length === 0) return

    // Immediate UI feedback (optimistic UI - fix #1)
    setIsAddingToCart(true)
    setAddToCartStatus(null)

    try {
      // Prepare sessions for batch API
      const sessionsToAdd = sessions.map(session => ({
        tutorId: session.tutorId || tutors[0].id,
        startDatetime: session.start.toISOString(),
        durationMin: session.duration,
      }))

      // Single batch API call (fixes #2, #3, #4)
      const response = await fetch('/api/cart/add-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          courseStudentRateCad: Number(course.studentRateCad), // Pass course rate (fix #4)
          sessions: sessionsToAdd,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajout au panier')
      }

      // Success feedback
      if (data.added > 0) {
        // Show brief success message
        setAddToCartStatus({
          type: 'success',
          message: data.skipped > 0
            ? `${data.added} session${data.added > 1 ? 's' : ''} ajoutée${data.added > 1 ? 's' : ''} au panier. ${data.skipped} session${data.skipped > 1 ? 's' : ''} déjà dans le panier ou non disponible.`
            : `${data.added} session${data.added > 1 ? 's' : ''} ajoutée${data.added > 1 ? 's' : ''} au panier avec succès!`,
        })

        // Clear selected sessions on success
        setSelectedSessions([])

        // Dispatch event to update cart counter in navbar
        window.dispatchEvent(new CustomEvent('cartUpdated'))

        // Redirect to cart page after brief delay to show success message
        setTimeout(() => {
          router.push('/panier')
        }, 500) // Short delay to show success feedback
      } else {
        throw new Error('Aucune session n\'a pu être ajoutée')
      }
    } catch (error) {
      console.error('Error adding sessions to cart:', error)
      setAddToCartStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'ajout au panier',
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Status Message (Success/Error) */}
      {addToCartStatus && (
        <div
          className={`rounded-lg p-4 border flex items-start gap-3 ${
            addToCartStatus.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
          }`}
        >
          {addToCartStatus.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium flex-1">{addToCartStatus.message}</p>
        </div>
      )}

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
                disabled={isAddingToCart}
                className="flex flex-col items-center gap-2 p-4 h-auto"
              >
                <span className="font-medium">{duration} min</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(course.studentRateCad * (duration === 60 ? 1 : duration === 90 ? 1.5 : 2))}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Session Selection */}
      <SessionSelection
        course={course}
        tutors={tutors}
        selectedDuration={selectedDuration}
        onSessionsSelected={handleSessionsSelected}
        initialTutorId={initialTutorId}
        isAddingToCart={isAddingToCart}
      />
    </div>
  )
}
