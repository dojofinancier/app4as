'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Clock, User, DollarSign, Calendar } from 'lucide-react'
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
}

export function CourseReservationForm({ course, tutors, user }: CourseReservationFormProps) {
  const router = useRouter()
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [selectedSessions, setSelectedSessions] = useState<TimeSlot[]>([])

  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration)
    setSelectedSessions([]) // Reset selection when duration changes
  }

  const handleSessionsSelected = async (sessions: TimeSlot[]) => {
    // Add all sessions to cart
    try {
      for (const session of sessions) {
        // Use the tutor from the session, or fall back to first tutor if no specific tutor selected
        const tutorId = session.tutorId || tutors[0].id
        
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId: course.id,
            tutorId: tutorId,
            startDatetime: session.start.toISOString(),
            durationMin: session.duration
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur lors de l\'ajout au panier')
        }
      }

      // Redirect to cart page
      router.push('/panier')
    } catch (error) {
      console.error('Error adding sessions to cart:', error)
      alert(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
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
      />
    </div>
  )
}
