import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/slots/generator'
import { addDays, format, set } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { rateLimit } from '@/lib/utils/rate-limit'

// Eastern Time zone (handles EST/EDT automatically)
const TIMEZONE = 'America/Toronto'

export async function GET(request: NextRequest) {
  // Rate limiting: 100 requests per minute per IP (public endpoint)
  const rateLimitResponse = rateLimit(request, 'PUBLIC')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    console.log('=== Course Availability API Called ===')
    
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const date = searchParams.get('date') // YYYY-MM-DD format
    const duration = parseInt(searchParams.get('duration') || '60')
    const tutorId = searchParams.get('tutorId') // Optional tutor filter

    console.log('Parameters:', { courseId, date, duration, tutorId })

    if (!courseId || !date) {
      console.log('Missing required parameters')
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Parse the date - interpret as Eastern Time, convert to UTC
    // Create date at midnight Eastern Time for the given date
    // fromZonedTime needs a Date where the components represent Eastern Time
    // We'll create a date in UTC first, convert to Eastern, set to midnight, then back to UTC
    const [year, month, day] = date.split('-').map(Number)
    // Create a reference date in UTC (any time will do, we'll adjust it)
    const referenceDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
    // Convert to Eastern Time to get the date components in Eastern
    const easternDate = toZonedTime(referenceDate, TIMEZONE)
    // Set to midnight in Eastern Time (using date-fns set to avoid timezone issues)
    const midnightEastern = set(easternDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
    // Convert back to UTC - this is midnight Eastern Time represented as UTC
    const targetDate = fromZonedTime(midnightEastern, TIMEZONE)
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
        tutorPriority: slot.tutorPriority,
        price: durationOption.price
      }]
    })

    // Filter slots for the specific date and tutor (if specified)
    const filteredSlots = transformedSlots.filter(slot => {
      const slotDate = format(slot.start, 'yyyy-MM-dd')
      const dateMatches = slotDate === date
      
      // If tutorId is specified, only return slots for that tutor
      if (tutorId) {
        return dateMatches && slot.tutorId === tutorId
      }
      
      return dateMatches
    })

    // Deduplicate slots by time - keep only the highest priority tutor (lowest priority number)
    const deduplicatedSlots = filteredSlots.reduce((acc, slot) => {
      const timeKey = `${slot.start.getTime()}-${slot.duration}`
      const existingSlot = acc.get(timeKey)
      
      if (!existingSlot || slot.tutorPriority < existingSlot.tutorPriority) {
        acc.set(timeKey, slot)
      }
      
      return acc
    }, new Map())

    const finalSlots = Array.from(deduplicatedSlots.values())

    console.log('Transformed slots:', transformedSlots.length)
    console.log('Filtered slots:', filteredSlots.length)
    console.log('Deduplicated slots:', finalSlots.length)

    // Check if the date has any availability (for calendar dots)
    const hasAvailability = finalSlots.length > 0

    const response = {
      hasAvailability,
      slots: finalSlots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        available: true,
        duration: slot.duration,
        tutorId: slot.tutorId,
        tutorName: slot.tutorName,
        tutorPriority: slot.tutorPriority,
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
  // Rate limiting: 100 requests per minute per IP (public endpoint)
  const rateLimitResponse = rateLimit(request, 'PUBLIC')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { courseId, dates, duration, tutorId } = await request.json()

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
        tutorPriority: slot.tutorPriority,
        price: durationOption.price
      }]
    })

    // Filter by tutor if specified
    let filteredSlots = transformedSlots
    if (tutorId) {
      filteredSlots = transformedSlots.filter(slot => slot.tutorId === tutorId)
    }

    // Deduplicate slots by time - keep only the highest priority tutor (lowest priority number)
    // Note: If tutorId is specified, this deduplication is less relevant but we keep it for consistency
    const deduplicatedSlots = filteredSlots.reduce((acc, slot) => {
      const timeKey = `${slot.start.getTime()}-${slot.duration}`
      const existingSlot = acc.get(timeKey)
      
      if (!existingSlot || slot.tutorPriority < existingSlot.tutorPriority) {
        acc.set(timeKey, slot)
      }
      
      return acc
    }, new Map())

    const finalSlots = Array.from(deduplicatedSlots.values())

    // Create a map of date -> has availability
    const availabilityMap: Record<string, boolean> = {}
    
    dates.forEach(dateStr => {
      const date = format(new Date(dateStr), 'yyyy-MM-dd')
      const hasSlots = finalSlots.some(slot => {
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
