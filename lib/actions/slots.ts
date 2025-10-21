'use server'

import { getAvailableSlots as getAvailableSlotsInternal } from '@/lib/slots/generator'

export async function getAvailableSlots(
  courseId: string,
  fromDate: Date,
  toDate: Date
) {
  return getAvailableSlotsInternal(courseId, fromDate, toDate)
}


