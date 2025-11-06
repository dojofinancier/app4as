import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/database-connection'
import { calculateStudentPrice } from '@/lib/pricing'
import {
  type TimeSlot,
  type TutorAvailability,
  type AvailabilityWindow,
  type BookedSlot,
  SLOT_GRID_MINUTES,
  LEAD_TIME_HOURS,
  MAX_ADVANCE_DAYS,
  VALID_DURATIONS,
} from './types'
import {
  addDays,
  addMinutes,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  isEqual,
  format,
  set,
} from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

// Eastern Time zone (handles EST/EDT automatically)
const TIMEZONE = 'America/Toronto'

/**
 * Get available slots for a course within a date range
 */
export async function getAvailableSlots(
  courseId: string,
  fromDate: Date,
  toDate: Date
): Promise<TimeSlot[]> {
  // 1. Get course data
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  })

  if (!course) {
    return []
  }

  // 2. Get all active tutors assigned to this course (optimized: only fetch needed fields)
  const tutorCourses = await prisma.tutorCourse.findMany({
    where: {
      courseId,
      active: true,
      tutor: { active: true },
    },
    select: {
      tutor: {
        select: {
          id: true,
          displayName: true,
          priority: true,
          hourlyBaseRateCad: true,
        },
      },
    },
  })

  if (tutorCourses.length === 0) {
    return []
  }

  // 3. For each tutor, get their availability
  const tutorAvailabilities = await Promise.all(
    tutorCourses.map(async (tc) => {
      const availability = await getTutorAvailability(
        tc.tutor.id,
        fromDate,
        toDate
      )
      return {
        tutorId: tc.tutor.id,
        tutorName: tc.tutor.displayName,
        tutorPriority: tc.tutor.priority,
        hourlyBaseRate: Number(tc.tutor.hourlyBaseRateCad),
        windows: availability,
      }
    })
  )

  // 4. Get all booked slots (appointments and holds) for these tutors
  const tutorIds = tutorCourses.map((tc) => tc.tutor.id)
  const bookedSlots = await getBookedSlots(tutorIds, fromDate, toDate)

  // 5. Generate slots for each tutor
  const allSlots: TimeSlot[] = []

  for (const tutorAvail of tutorAvailabilities) {
    const tutorBookedSlots = bookedSlots.filter(
      (slot) => slot.tutorId === tutorAvail.tutorId
    )

    const tutorSlots = generateSlotsForTutor(
      tutorAvail,
      courseId,
      tutorBookedSlots,
      course.studentRateCad
    )

    allSlots.push(...tutorSlots)
  }

  // 6. Sort by start time, then by tutor priority
  const sortedSlots = allSlots.sort((a, b) => {
    const timeDiff = a.startDatetime.getTime() - b.startDatetime.getTime()
    if (timeDiff !== 0) return timeDiff
    return a.tutorPriority - b.tutorPriority
  })

  return sortedSlots
}

/**
 * Get availability windows for a tutor
 */
async function getTutorAvailability(
  tutorId: string,
  fromDate: Date,
  toDate: Date
): Promise<AvailabilityWindow[]> {
  // Get recurring availability rules with retry logic
  const rules = await withRetry(async () => {
    return await prisma.availabilityRule.findMany({
      where: { tutorId },
    })
  })

  // Get exceptions with retry logic - use proper Date objects
  const exceptions = await withRetry(async () => {
    return await prisma.availabilityException.findMany({
      where: {
        tutorId,
        OR: [
          // Exception covers the entire date range
          {
            startDate: {
              lte: fromDate,
            },
            endDate: {
              gte: toDate,
            },
          },
          // Exception starts within the date range
          {
            startDate: {
              gte: fromDate,
              lt: toDate,
            },
          },
          // Exception ends within the date range
          {
            endDate: {
              gt: fromDate,
              lte: toDate,
            },
          },
        ],
      },
    })
  })

  // Get time off with retry logic
  const timeOffs = await withRetry(async () => {
    return await prisma.timeOff.findMany({
      where: {
        tutorId,
        OR: [
          {
            startDatetime: {
              lte: toDate,
            },
            endDatetime: {
              gte: fromDate,
            },
          },
        ],
      },
    })
  })

  const windows: AvailabilityWindow[] = []

  // Generate windows from recurring rules
  // Server is now configured to operate in Eastern Time (TZ=America/Toronto)
  // So we can use simple date operations
  let currentDate = startOfDay(fromDate)
  const endDate = endOfDay(toDate)

  while (isBefore(currentDate, endDate)) {
    // getDay() now returns weekday in Eastern Time since TZ is set
    const weekday = currentDate.getDay()

    // Check for exceptions first - use string comparison to avoid timezone issues
    const dateExceptions = exceptions.filter((ex) => {
      // Convert dates to YYYY-MM-DD format for comparison (all in Eastern Time)
      const currentDateStr = format(currentDate, 'yyyy-MM-dd')
      const exceptionStartEastern = toZonedTime(ex.startDate, TIMEZONE)
      const exceptionEndEastern = toZonedTime(ex.endDate, TIMEZONE)
      const exceptionStartStr = format(exceptionStartEastern, 'yyyy-MM-dd')
      const exceptionEndStr = format(exceptionEndEastern, 'yyyy-MM-dd')
      
      return currentDateStr >= exceptionStartStr && currentDateStr <= exceptionEndStr
    })

    if (dateExceptions.length > 0) {
      // Check if any exception makes this day unavailable
      const unavailableExceptions = dateExceptions.filter((ex) => ex.isUnavailable)
      if (unavailableExceptions.length > 0) {
        // Skip this day - tutor is unavailable
        currentDate = addDays(currentDate, 1)
        continue
      }
      
      // If there are available exceptions, use them instead of regular rules
      // Note: The new schema doesn't have time slots in exceptions, only full-day availability
      // So we skip days with exceptions for now (they're either unavailable or we need to implement time-specific exceptions)
      currentDate = addDays(currentDate, 1)
      continue
    } else {
      // Use regular rules for this weekday
      const dayRules = rules.filter((rule) => rule.weekday === weekday)
      dayRules.forEach((rule) => {
        const start = parseDateTimeFromParts(currentDate, rule.startTime)
        const end = parseDateTimeFromParts(currentDate, rule.endTime)
        windows.push({ startDatetime: start, endDatetime: end })
      })
    }

    currentDate = addDays(currentDate, 1)
  }

  // Remove time off from windows
  // Note: timeOff datetimes are stored in UTC, windows are now in UTC (from parseDateTimeFromParts)
  const finalWindows = windows.filter((window) => {
    return !timeOffs.some((timeOff) =>
      isOverlapping(
        window.startDatetime,
        window.endDatetime,
        timeOff.startDatetime,
        timeOff.endDatetime
      )
    )
  })

  return finalWindows
}

/**
 * Get all booked slots (appointments and holds) for tutors
 */
async function getBookedSlots(
  tutorIds: string[],
  fromDate: Date,
  toDate: Date
): Promise<BookedSlot[]> {
  const slots: BookedSlot[] = []

  // Get appointments with retry logic (optimized: only fetch needed fields)
  // CRITICAL: Check for OVERLAPS, not just startDatetime within range
  // An appointment that starts before fromDate but ends after fromDate should be included
  const appointments = await withRetry(async () => {
    return await prisma.appointment.findMany({
      where: {
        tutorId: { in: tutorIds },
        status: { in: ['scheduled', 'completed'] },
        // Check for overlap: appointment starts before toDate AND ends after fromDate
        AND: [
          { startDatetime: { lt: toDate } },
          { endDatetime: { gt: fromDate } },
        ],
      },
      select: {
        tutorId: true,
        startDatetime: true,
        endDatetime: true,
      },
    })
  })

  slots.push(
    ...appointments.map((apt) => ({
      tutorId: apt.tutorId,
      startDatetime: apt.startDatetime,
      endDatetime: apt.endDatetime,
    }))
  )

  // Get non-expired holds with retry logic (optimized: only fetch needed fields)
  // CRITICAL: Check for OVERLAPS, not just startDatetime within range
  // A hold that starts before fromDate but ends after fromDate should be included
  const now = new Date()
  const holds = await withRetry(async () => {
    return await prisma.slotHold.findMany({
      where: {
        tutorId: { in: tutorIds },
        expiresAt: {
          gt: now,
        },
        // Check for overlap: hold starts before toDate AND (start + duration) ends after fromDate
        // We approximate by checking if startDatetime is within an extended range that accounts for max duration
        // More precise: check if startDatetime < toDate AND (startDatetime + max duration) > fromDate
        AND: [
          { startDatetime: { lt: toDate } },
          // Approximate: holds typically start within range or just before, so check if start + max duration overlaps
          // This is conservative - we'll include all holds that could potentially overlap
          {
            OR: [
              // Hold starts within the range
              { startDatetime: { gte: fromDate, lte: toDate } },
              // Hold starts before but could extend into range (check if start + max duration > fromDate)
              {
                AND: [
                  { startDatetime: { lt: fromDate } },
                  // We'll filter in code to check actual duration overlap
                ],
              },
            ],
          },
        ],
      },
      select: {
        tutorId: true,
        startDatetime: true,
        durationMin: true,
      },
    })
  })
  
  // Filter holds to only include those that actually overlap the date range
  const overlappingHolds = holds.filter(hold => {
    const holdEnd = addMinutes(hold.startDatetime, hold.durationMin)
    // Hold overlaps if: hold starts before toDate AND hold ends after fromDate
    return isBefore(hold.startDatetime, toDate) && isAfter(holdEnd, fromDate)
  })

  slots.push(
    ...overlappingHolds.map((hold) => ({
      tutorId: hold.tutorId,
      startDatetime: hold.startDatetime,
      endDatetime: addMinutes(hold.startDatetime, hold.durationMin),
    }))
  )

  return slots
}

/**
 * Generate slots for a specific tutor
 */
function generateSlotsForTutor(
  tutorAvail: TutorAvailability,
  courseId: string,
  bookedSlots: BookedSlot[],
  studentRateCad: any
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const now = new Date()
  const minStartTime = addMinutes(now, LEAD_TIME_HOURS * 60)
  const maxStartTime = addDays(now, MAX_ADVANCE_DAYS)

  for (const window of tutorAvail.windows) {
    let currentSlotStart = window.startDatetime

    // Snap to grid
    const minutes = currentSlotStart.getMinutes()
    const gridOffset = minutes % SLOT_GRID_MINUTES
    if (gridOffset !== 0) {
      currentSlotStart = addMinutes(
        currentSlotStart,
        SLOT_GRID_MINUTES - gridOffset
      )
    }

    // Generate slots on the grid
    while (isBefore(currentSlotStart, window.endDatetime)) {
      // Check lead time and max advance constraints
      if (
        isBefore(currentSlotStart, minStartTime) ||
        isAfter(currentSlotStart, maxStartTime)
      ) {
        currentSlotStart = addMinutes(currentSlotStart, SLOT_GRID_MINUTES)
        continue
      }

      // Calculate which durations fit in the remaining window
      const availableDurations = VALID_DURATIONS.filter((duration) => {
        const slotEnd = addMinutes(currentSlotStart, duration)
        // CRITICAL: Check both that slot fits in window AND is not booked
        // Parentheses are important - operator precedence would otherwise short-circuit the booking check
        return (
          (isBefore(slotEnd, window.endDatetime) || isEqual(slotEnd, window.endDatetime)) &&
          !isSlotBooked(currentSlotStart, slotEnd, bookedSlots)
        )
      })

      // If at least one duration is available, create a slot
      if (availableDurations.length > 0) {
        slots.push({
          tutorId: tutorAvail.tutorId,
          tutorName: tutorAvail.tutorName,
          tutorPriority: tutorAvail.tutorPriority,
          courseId,
          startDatetime: currentSlotStart,
          availableDurations: availableDurations.map((duration) => ({
            minutes: duration,
            price: calculateStudentPrice(studentRateCad, duration),
          })),
        })
      }

      currentSlotStart = addMinutes(currentSlotStart, SLOT_GRID_MINUTES)
    }
  }

  return slots
}

/**
 * Check if a slot time is already booked
 */
function isSlotBooked(
  slotStart: Date,
  slotEnd: Date,
  bookedSlots: BookedSlot[]
): boolean {
  return bookedSlots.some((booked) =>
    isOverlapping(slotStart, slotEnd, booked.startDatetime, booked.endDatetime)
  )
}

/**
 * Check if two time ranges overlap
 */
function isOverlapping(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return isBefore(start1, end2) && isAfter(end1, start2)
}

/**
 * Parse a date-time from date and time string (HH:MM)
 * Times are interpreted as Eastern Time (EST/EDT)
 */
function parseDateTimeFromParts(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  
  // Create date in Eastern Time zone
  // First, get the date in Eastern Time
  const easternDate = toZonedTime(date, TIMEZONE)
  
  // Set the time in Eastern Time
  const dateWithTime = set(easternDate, { hours, minutes, seconds: 0, milliseconds: 0 })
  
  // Convert back to UTC for storage/comparison
  return fromZonedTime(dateWithTime, TIMEZONE)
}


