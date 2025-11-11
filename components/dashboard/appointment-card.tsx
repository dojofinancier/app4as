'use client'

import { formatDateTime, translateAppointmentStatus } from '@/lib/utils'
import { MessageIndicator } from '../messaging/message-indicator'

interface AppointmentCardProps {
  appointment: {
    id: string
    userId: string
    tutorId: string
    courseId: string
    startDatetime: Date
    endDatetime: Date
    status: string
    meetingLink?: string | null
    course: {
      id: string
      slug: string
      titleFr: string
      descriptionFr: string
      active: boolean
      createdAt: Date
      studentRateCad: number
    }
    tutor: {
      id: string
      displayName: string
      bioFr: string
      hourlyBaseRateCad: number
      priority: number
      active: boolean
      user: {
        id: string
        firstName: string
        lastName: string
        email: string
        phone: string | null
        role: string
      }
    }
  }
  isPast?: boolean
}

export function AppointmentCard({
  appointment,
  isPast: _isPast = false,
}: AppointmentCardProps) {


  return (
    <div className="rounded-lg border p-3 sm:p-4 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 w-full">
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <h3 className="font-semibold text-sm sm:text-base break-words">{appointment.course.titleFr}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground break-words mt-1">
            Tuteur: {appointment.tutor.user.firstName} {appointment.tutor.user.lastName}
          </p>
          <p className="mt-1 text-xs sm:text-sm font-medium">
            {formatDateTime(new Date(appointment.startDatetime))}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Durée:{' '}
            {Math.round(
              (new Date(appointment.endDatetime).getTime() -
                new Date(appointment.startDatetime).getTime()) /
                1000 /
                60
            )}{' '}
            minutes
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${
                appointment.status === 'scheduled'
                  ? 'bg-info-light text-info dark:bg-info/20 dark:text-info'
                  : appointment.status === 'cancelled'
                  ? 'bg-error-light text-error dark:bg-error/20 dark:text-error'
                  : appointment.status === 'completed'
                  ? 'bg-success-light text-success dark:bg-success/20 dark:text-success'
                  : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
              }`}
            >
              {translateAppointmentStatus(appointment.status)}
            </span>
          </div>
          
          {/* Meeting Link Section */}
          {appointment.status === 'scheduled' && appointment.meetingLink && (
            <div className="mt-3 p-2 sm:p-3 bg-info-light rounded-lg overflow-hidden">
              <h4 className="text-xs sm:text-sm font-medium text-info mb-2">Lien de réunion</h4>
              <a
                href={appointment.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-info hover:text-info/80 underline break-all text-xs sm:text-sm"
              >
                {appointment.meetingLink}
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
          <MessageIndicator 
            tutorId={appointment.tutorId}
          />
        </div>
      </div>
    </div>
  )
}


