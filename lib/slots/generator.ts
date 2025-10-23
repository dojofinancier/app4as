import { prisma } from '@/lib/prisma'
import { calculateStudentPrice } from '@/lib/pricing'
import {
  type TimeSlot,
  type TutorAvailability,
  type AvailabilityWindow,
  type BookedSlot,
  type Duration,
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
  isWithinInterval,
  parseISO,
  format,
  parse,
  set,
} from 'date-fns'

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

  // 2. Get all active tutors assigned to this course
  const tutorCourses = await prisma.tutorCourse.findMany({
    where: {
      courseId,
      active: true,
      tutor: { active: true },
    },
    include: {
      tutor: {
        include: {
          user: true,
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
        hourlyBaseRate: tc.tutor.hourlyBaseRateCad.toNumber(),
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
  // Get recurring availability rules
  const rules = await prisma.availabilityRule.findMany({
    where: { tutorId },
  })

  // Get exceptions
  const exceptions = await prisma.availabilityException.findMany({
    where: {
      tutorId,
      date: {
        gte: format(fromDate, 'yyyy-MM-dd'),
        lte: format(toDate, 'yyyy-MM-dd'),
      },
    },
  })

  // Get time off
  const timeOffs = await prisma.timeOff.findMany({
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

  const windows: AvailabilityWindow[] = []

  // Generate windows from recurring rules
  let currentDate = startOfDay(fromDate)
  const endDate = endOfDay(toDate)

  while (isBefore(currentDate, endDate)) {
    const weekday = currentDate.getDay()

    // Check for exceptions first
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const dateExceptions = exceptions.filter((ex) => ex.date === dateStr)

    if (dateExceptions.length > 0) {
      // Use exceptions instead of regular rules
      dateExceptions
        .filter((ex) => ex.isOpen)
        .forEach((ex) => {
          const start = parseDateTimeFromParts(currentDate, ex.startTime)
          const end = parseDateTimeFromParts(currentDate, ex.endTime)
          windows.push({ startDatetime: start, endDatetime: end })
        })
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

  // Get appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      tutorId: { in: tutorIds },
      startDatetime: {
        gte: fromDate,
        lte: toDate,
      },
      status: { in: ['scheduled', 'completed'] },
    },
  })

  slots.push(
    ...appointments.map((apt) => ({
      tutorId: apt.tutorId,
      startDatetime: apt.startDatetime,
      endDatetime: apt.endDatetime,
    }))
  )

  // Get non-expired holds
  const now = new Date()
  const holds = await prisma.slotHold.findMany({
    where: {
      tutorId: { in: tutorIds },
      startDatetime: {
        gte: fromDate,
        lte: toDate,
      },
      expiresAt: {
        gt: now,
      },
    },
  })

  slots.push(
    ...holds.map((hold) => ({
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
        return (
          !isAfter(slotEnd, window.endDatetime) &&
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
 */
function parseDateTimeFromParts(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 })
}


