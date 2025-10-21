import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAvailableSlots } from '@/lib/slots/generator'
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Course Availability API Called ===')
    
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const date = searchParams.get('date') // YYYY-MM-DD format
    const duration = parseInt(searchParams.get('duration') || '60')

    console.log('Parameters:', { courseId, date, duration })

    if (!courseId || !date) {
      console.log('Missing required parameters')
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Parse the date
    const targetDate = new Date(date + 'T00:00:00')
    const fromDate = targetDate
    const toDate = addDays(targetDate, 1) // Get availability for the specific date

    console.log('Date range:', { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() })

    // Get available slots using your existing logic
    console.log('Calling getAvailableSlots...')
    const availableSlots = await getAvailableSlots(courseId, fromDate, toDate)
    console.log('Available slots returned:', availableSlots.length)

    // Transform slots to match calendar component expectations
    const transformedSlots = availableSlots.flatMap(slot => {
      // Find the duration option that matches our requested duration
      const durationOption = slot.availableDurations.find(d => d.minutes === duration)
      if (!durationOption) return []

      // Create a slot for this specific duration
      const endTime = new Date(slot.startDatetime.getTime() + duration * 60000)
      
      return [{
        start: slot.startDatetime,
        end: endTime,
        available: true,
        duration: duration,
        tutorId: slot.tutorId,
        tutorName: slot.tutorName,
        price: durationOption.price
      }]
    })

    // Filter slots for the specific date
    const filteredSlots = transformedSlots.filter(slot => {
      const slotDate = format(slot.start, 'yyyy-MM-dd')
      return slotDate === date
    })

    console.log('Transformed slots:', transformedSlots.length)
    console.log('Filtered slots:', filteredSlots.length)

    // Check if the date has any availability (for calendar dots)
    const hasAvailability = filteredSlots.length > 0

    const response = {
      hasAvailability,
      slots: filteredSlots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        available: true,
        duration: slot.duration,
        tutorId: slot.tutorId,
        tutorName: slot.tutorName,
        price: slot.price
      }))
    }

    console.log('Response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('=== ERROR in Course Availability API ===')
    console.error('Error details:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Une erreur est survenue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// New endpoint to check availability for multiple dates (for calendar dots)
export async function POST(request: NextRequest) {
  try {
    const { courseId, dates, duration } = await request.json()

    if (!courseId || !dates || !Array.isArray(dates)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get date range
    const startDate = new Date(Math.min(...dates.map(d => new Date(d).getTime())))
    const endDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())))

    // Get available slots for the entire range
    const availableSlots = await getAvailableSlots(courseId, startDate, endDate)

    // Transform slots to match calendar component expectations
    const transformedSlots = availableSlots.flatMap(slot => {
      // Find the duration option that matches our requested duration
      const durationOption = slot.availableDurations.find(d => d.minutes === duration)
      if (!durationOption) return []

      // Create a slot for this specific duration
      const endTime = new Date(slot.startDatetime.getTime() + duration * 60000)
      
      return [{
        start: slot.startDatetime,
        end: endTime,
        available: true,
        duration: duration,
        tutorId: slot.tutorId,
        tutorName: slot.tutorName,
        price: durationOption.price
      }]
    })

    // Create a map of date -> has availability
    const availabilityMap: Record<string, boolean> = {}
    
    dates.forEach(dateStr => {
      const date = format(new Date(dateStr), 'yyyy-MM-dd')
      const hasSlots = transformedSlots.some(slot => {
        const slotDate = format(slot.start, 'yyyy-MM-dd')
        return slotDate === date
      })
      availabilityMap[date] = hasSlots
    })

    return NextResponse.json({ availabilityMap })
  } catch (error) {
    console.error('Error checking multiple dates availability:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}
