'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, isSameDay, isToday, isPast, addMinutes, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  duration: number
}

interface CalendarBookingProps {
  courseId: string
  tutorId: string
  onSlotSelect: (slot: TimeSlot) => void
  selectedDuration: number
  selectedSessions?: TimeSlot[]
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
]

export function CalendarBooking({ 
  courseId, 
  tutorId, 
  onSlotSelect, 
  selectedDuration,
  selectedSessions = []
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
      const response = await fetch(`/api/course-availability?courseId=${courseId}&date=${dateStr}&duration=${selectedDuration}`)
      
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

  // Check if a date has availability (for calendar dots)
  const hasAvailability = async (date: Date): Promise<boolean> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const response = await fetch(`/api/course-availability?courseId=${courseId}&date=${dateStr}&duration=${selectedDuration}`)
      
      if (!response.ok) {
        return false
      }
      
      const data = await response.json()
      return data.hasAvailability || false
    } catch (error) {
      console.error('Error checking availability:', error)
      return false
    }
  }

  const loadAvailableSlots = async (date: Date) => {
    setLoading(true)
    try {
      const slots = await fetchAvailableSlots(date)
      setAvailableSlots(slots)
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
      const response = await fetch('/api/course-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          dates,
          duration: selectedDuration
        })
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

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSessions.some(session => 
      session.start.getTime() === slot.start.getTime() &&
      session.end.getTime() === slot.end.getTime()
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const baseDate = prev || new Date()
      return direction === 'next' ? addMonths(baseDate, 1) : subMonths(baseDate, 1)
    })
  }

  // Initialize currentMonth on client side to avoid hydration issues
  useEffect(() => {
    if (!currentMonth) {
      setCurrentMonth(new Date())
    }
  }, [currentMonth])

  // Load month availability when currentMonth or selectedDuration changes
  useEffect(() => {
    if (currentMonth) {
      loadMonthAvailability()
    }
  }, [currentMonth, selectedDuration, courseId])

  // Load slots for selected date on mount
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate)
    }
  }, [selectedDate, selectedDuration])

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
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
              <div key={`day-header-${index}`} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Date cells */}
            {calendarDays.map((date) => {
              const isTodayDate = isToday(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isPastDate = isPast(date) && !isTodayDate
              const dateStr = format(date, 'yyyy-MM-dd')
              const hasSlots = availabilityMap[dateStr] || false
              
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
                    hasSlots && !isSelected && !isPastDate && "bg-green-50 hover:bg-green-100 border-green-200"
                  )}
                  onClick={() => !isPastDate && isCurrentMonth && handleDateSelect(date)}
                  disabled={isPastDate || !isCurrentMonth}
                >
                  <span className="text-sm font-medium">{format(date, 'd')}</span>
                  {/* Availability indicator */}
                  {hasSlots && !isPastDate && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
                  )}
                </Button>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <span>Indisponible</span>
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
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Chargement des créneaux...</p>
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
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    className="w-full h-12 flex items-center justify-center gap-2"
                    onClick={() => handleSlotSelect(slot)}
                    disabled={isSelected}
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