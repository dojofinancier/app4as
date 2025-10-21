import { Decimal } from '@prisma/client/runtime/library'

export type Duration = 60 | 90 | 120

export interface TimeSlot {
  tutorId: string
  tutorName: string
  tutorPriority: number
  courseId: string
  startDatetime: Date
  availableDurations: Array<{
    minutes: Duration
    price: number
  }>
}

export interface AvailabilityWindow {
  startDatetime: Date
  endDatetime: Date
}

export interface TutorAvailability {
  tutorId: string
  tutorName: string
  tutorPriority: number
  hourlyBaseRate: number
  windows: AvailabilityWindow[]
}

export interface BookedSlot {
  tutorId: string
  startDatetime: Date
  endDatetime: Date
}

export const SLOT_GRID_MINUTES = 30
export const LEAD_TIME_HOURS = 12
export const MAX_ADVANCE_DAYS = 60
export const CANCELLATION_CUTOFF_HOURS = 2

export const VALID_DURATIONS: Duration[] = [60, 90, 120]


