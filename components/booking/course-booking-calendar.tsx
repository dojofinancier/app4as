'use client'

import { useState, useEffect } from 'react'
import { addDays, startOfWeek, format } from 'date-fns'
import { getAvailableSlots } from '@/lib/actions/slots'
import { addToCart } from '@/lib/actions/cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { frCA } from '@/lib/i18n/fr-CA'
import type { TimeSlot, Duration } from '@/lib/slots/types'

interface CourseBookingCalendarProps {
  courseId: string
}

export function CourseBookingCalendar({
  courseId,
}: CourseBookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDuration, setSelectedDuration] = useState<Duration>(60)

  useEffect(() => {
    loadSlots()
  }, [courseId, selectedDate])

  const loadSlots = async () => {
    setLoading(true)
    try {
      const fromDate = startOfWeek(selectedDate)
      const toDate = addDays(fromDate, 7)

      const availableSlots = await getAvailableSlots(courseId, fromDate, toDate)
      setSlots(availableSlots)
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (slot: TimeSlot, duration: Duration) => {
    const durationOption = slot.availableDurations.find(
      (d) => d.minutes === duration
    )

    if (!durationOption) {
      alert("Cette durée n'est pas disponible")
      return
    }

    const result = await addToCart({
      courseId,
      tutorId: slot.tutorId,
      startDatetime: slot.startDatetime,
      durationMin: duration,
    })

    if (result.success) {
      alert('Ajouté au panier!')
      loadSlots() // Reload to update availability
    } else {
      alert(result.error || 'Une erreur est survenue')
    }
  }

  const groupedSlots = groupSlotsByDate(slots)

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Créneaux disponibles</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              >
                ← Semaine précédente
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              >
                Semaine suivante →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">{frCA.common.loading}</p>
              </div>
            ) : Object.keys(groupedSlots).length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {frCA.booking.noSlotsAvailable}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <div key={date}>
                    <h3 className="mb-3 font-semibold">{formatDate(date)}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {dateSlots.map((slot, idx) => (
                        <div
                          key={`${slot.tutorId}-${slot.startDatetime.getTime()}-${idx}`}
                          className="rounded-lg border p-4"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {formatTime(slot.startDatetime)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {slot.tutorName}
                              </p>
                            </div>
                          </div>

                          <div className="mb-3 flex gap-2">
                            {[60, 90, 120].map((duration) => {
                              const option = slot.availableDurations.find(
                                (d) => d.minutes === duration
                              )
                              return (
                                <Button
                                  key={duration}
                                  size="sm"
                                  variant={
                                    selectedDuration === duration
                                      ? 'default'
                                      : 'outline'
                                  }
                                  disabled={!option}
                                  onClick={() =>
                                    setSelectedDuration(duration as Duration)
                                  }
                                >
                                  {duration}min
                                </Button>
                              )
                            })}
                          </div>

                          {slot.availableDurations.find(
                            (d) => d.minutes === selectedDuration
                          ) && (
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-primary">
                                {formatCurrency(
                                  slot.availableDurations.find(
                                    (d) => d.minutes === selectedDuration
                                  )!.price
                                )}
                              </span>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAddToCart(slot, selectedDuration)
                                }
                              >
                                {frCA.booking.addToCart}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>{frCA.booking.cart}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Votre panier s'affichera ici
            </p>
            <Button asChild className="mt-4 w-full">
              <a href="/panier">Voir le panier</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function groupSlotsByDate(slots: TimeSlot[]): Record<string, TimeSlot[]> {
  const grouped: Record<string, TimeSlot[]> = {}

  slots.forEach((slot) => {
    const dateKey = format(slot.startDatetime, 'yyyy-MM-dd')
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(slot)
  })

  return grouped
}

