'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { frCA } from '@/lib/i18n/fr-CA'
import { cancelAppointment } from '@/lib/actions/appointments'
import { MessageIndicator } from '../messaging/message-indicator'
import type { Appointment, Course, Tutor, User } from '@prisma/client'

interface AppointmentCardProps {
  appointment: Appointment & {
    course: Course
    tutor: Tutor & { user: User }
  }
  isPast?: boolean
}

export function AppointmentCard({
  appointment,
  isPast = false,
}: AppointmentCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const canCancel = !isPast && appointment.status === 'scheduled'
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const canCancelInTime = new Date(appointment.startDatetime) > twoHoursFromNow

  const handleCancel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous?')) {
      return
    }

    setIsLoading(true)
    const result = await cancelAppointment(appointment.id)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Une erreur est survenue')
      setIsLoading(false)
    }
  }


  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{appointment.course.titleFr}</h3>
          <p className="text-sm text-muted-foreground">
            Tuteur: {appointment.tutor.user.firstName} {appointment.tutor.user.lastName}
          </p>
          <p className="mt-1 text-sm font-medium">
            {formatDateTime(new Date(appointment.startDatetime))}
          </p>
          <p className="text-sm text-muted-foreground">
            Durée:{' '}
            {Math.round(
              (new Date(appointment.endDatetime).getTime() -
                new Date(appointment.startDatetime).getTime()) /
                1000 /
                60
            )}{' '}
            minutes
          </p>
          <div className="mt-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                appointment.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  : appointment.status === 'cancelled'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  : appointment.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}
            >
              {appointment.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <MessageIndicator 
            tutorId={appointment.tutorId}
          />
          
          {canCancel && canCancelInTime && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {frCA.dashboard.student.cancelAppointment}
            </Button>
          )}

          {canCancel && !canCancelInTime && (
            <p className="text-xs text-muted-foreground">
              Trop tard pour annuler (moins de 2h)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}


