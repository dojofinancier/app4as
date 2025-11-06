'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, isSameDay, isToday, isPast, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isAfter, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { MAX_ADVANCE_DAYS } from '@/lib/slots/types'
import { WEEKDAYS } from '@/lib/constants/weekdays'

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  duration: number
}

interface CalendarBookingProps {
  courseId: string
  onSlotSelect: (slot: TimeSlot) => void
  selectedDuration: number
  selectedSessions?: TimeSlot[]
  selectedTutorId?: string
}

export function CalendarBooking({ 
  courseId, 
  onSlotSelect, 
  selectedDuration,
  selectedSessions = [],
  selectedTutorId = 'all'
}: CalendarBookingProps) {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({})

  // Get month dates for calendar grid
  const monthStart = currentMonth ? startOfMonth(currentMonth) : new Date()
  const monthEnd = currentMonth ? endOfMonth(currentMonth) : new Date()
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Fetch real available slots from API
  const fetchAvailableSlots = async (date: Date): Promise<TimeSlot[]> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      let url = `/api/course-availability?courseId=${courseId}&date=${dateStr}&duration=${selectedDuration}`
      
      // Add tutorId parameter if a specific tutor is selected
      if (selectedTutorId !== 'all') {
        url += `&tutorId=${selectedTutorId}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }
      
      const data = await response.json()
      
      // Convert string dates back to Date objects
      return (data.slots || []).map((slot: any) => ({
        ...slot,
        start: new Date(slot.start),
        end: new Date(slot.end)
      }))
    } catch (error) {
      console.error('Error fetching available slots:', error)
      return []
    }
  }

  const loadAvailableSlots = async (date: Date) => {
    setLoading(true)
    try {
      const slots = await fetchAvailableSlots(date)
      
      // Filter slots by selected tutor if not "all"
      let filteredSlots = slots
      if (selectedTutorId !== 'all') {
        filteredSlots = slots.filter(slot => (slot as any).tutorId === selectedTutorId)
      }
      
      setAvailableSlots(filteredSlots)
    } catch (error) {
      console.error('Error loading available slots:', error)
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  // Load availability for all dates in the current month
  const loadMonthAvailability = async () => {
    if (!currentMonth) return
    
    try {
      const dates = calendarDays.map(date => format(date, 'yyyy-MM-dd'))
      const requestBody: any = {
        courseId,
        dates,
        duration: selectedDuration
      }
      
      // Add tutorId if a specific tutor is selected
      if (selectedTutorId !== 'all') {
        requestBody.tutorId = selectedTutorId
      }
      
      const response = await fetch('/api/course-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailabilityMap(data.availabilityMap || {})
      }
    } catch (error) {
      console.error('Error loading month availability:', error)
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    loadAvailableSlots(date)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    onSlotSelect(slot)
  }

  // Helper function to check if two time slots overlap
  const slotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
    // Two slots overlap if one starts before the other ends
    return slot1.start < slot2.end && slot2.start < slot1.end
  }

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSessions.some(session => {
      const timeMatch = session.start.getTime() === slot.start.getTime() &&
                       session.end.getTime() === slot.end.getTime()
      
      if (selectedTutorId === 'all') {
        return timeMatch
      } else {
        return timeMatch && (session as any).tutorId === (slot as any).tutorId
      }
    })
  }

  const isSlotConflicting = (slot: TimeSlot) => {
    return selectedSessions.some(session => {
      if (selectedTutorId === 'all') {
        return slotsOverlap(slot, session)
      } else {
        // For specific tutor mode, only check overlap if it's the same tutor
        return (session as any).tutorId === (slot as any).tutorId && slotsOverlap(slot, session)
      }
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const baseDate = prev || new Date()
      const nextMonth = direction === 'next' ? addMonths(baseDate, 1) : subMonths(baseDate, 1)
      
      // Prevent navigating beyond MAX_ADVANCE_DAYS from today
      const maxDate = addDays(new Date(), MAX_ADVANCE_DAYS)
      const maxMonth = startOfMonth(maxDate)
      
      if (direction === 'next' && isAfter(startOfMonth(nextMonth), maxMonth)) {
        return baseDate // Don't navigate beyond max
      }
      
      return nextMonth
    })
  }

  // Initialize currentMonth on client side to avoid hydration issues
  useEffect(() => {
    if (!currentMonth) {
      setCurrentMonth(new Date())
    }
  }, [currentMonth])

  // Load month availability when currentMonth, selectedDuration, selectedTutorId, or courseId changes
  useEffect(() => {
    if (currentMonth) {
      // Clear availability map when tutor selection changes to avoid showing stale data
      setAvailabilityMap({})
      loadMonthAvailability()
    }
  }, [currentMonth, selectedDuration, courseId, selectedTutorId])

  // Load slots for selected date on mount
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate)
    }
  }, [selectedDate, selectedDuration, selectedTutorId])

  // Don't render until currentMonth is initialized
  if (!currentMonth) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Side - Monthly Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={
                  currentMonth &&
                  isAfter(startOfMonth(addMonths(currentMonth, 1)), startOfMonth(addDays(new Date(), MAX_ADVANCE_DAYS)))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers - Calendar starts on Monday (weekStartsOn: 1) */}
            {/* Map calendar grid positions (0-6) to weekday IDs: Monday=1, Tuesday=2, ..., Sunday=0 */}
            {[1, 2, 3, 4, 5, 6, 0].map((weekdayId) => {
              const weekday = WEEKDAYS.find(day => day.id === weekdayId)
              return (
                <div key={`day-header-${weekdayId}`} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {weekday?.letter || ''}
                </div>
              )
            })}
            
            {/* Date cells */}
            {calendarDays.map((date) => {
              const isTodayDate = isToday(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isPastDate = isPast(date) && !isTodayDate
              const dateStr = format(date, 'yyyy-MM-dd')
              const hasSlots = availabilityMap[dateStr] || false
              const isAvailable = hasSlots && !isPastDate && isCurrentMonth
              
              return (
                <Button
                  key={date.toISOString()}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0 relative",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isPastDate && "opacity-50 cursor-not-allowed",
                    isTodayDate && !isSelected && "ring-2 ring-primary ring-offset-1",
                    // Only apply green tint for available dates that aren't selected
                    isAvailable && !isSelected && "bg-success-light hover:bg-success/20"
                  )}
                  onClick={() => !isPastDate && isCurrentMonth && handleDateSelect(date)}
                  disabled={isPastDate || !isCurrentMonth}
                >
                  <span className="text-sm font-medium">{format(date, 'd')}</span>
                  {/* Green dot indicator - only for available dates */}
                  {isAvailable && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-success rounded-full" />
                  )}
                </Button>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span>Disponible</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Side - Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : 'Sélectionnez une date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Sélectionnez une date dans le calendrier pour voir les créneaux disponibles</p>
            </div>
          ) : loading ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun créneau disponible pour cette date</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableSlots.map((slot, index) => {
                const isSelected = isSlotSelected(slot)
                const isConflicting = isSlotConflicting(slot)
                const isDisabled = isSelected || isConflicting
                
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full h-12 flex items-center justify-center gap-2 ${
                      isConflicting ? "opacity-50 bg-muted border-border text-muted-foreground" : ""
                    }`}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={isDisabled}
                  >
                    <span className="text-sm font-medium">
                      {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                    </span>
                    {isSelected ? (
                      <Badge variant="secondary" className="text-xs">
                        Sélectionné
                      </Badge>
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}