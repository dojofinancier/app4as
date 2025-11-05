'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { TutorMessageIndicator } from '../messaging/tutor-message-indicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Link as LinkIcon, Save, X } from 'lucide-react'
import Link from 'next/link'
import { updateMeetingLink } from '@/lib/actions/reservations'
import type { Appointment, Course, Tutor, User } from '@prisma/client'

interface TutorAppointmentCardProps {
  appointment: {
    id: string
    userId: string
    tutorId: string
    startDatetime: Date
    endDatetime: Date
    status: string
    meetingLink?: string | null
    course: {
      titleFr: string
    }
    user: {
      firstName: string
      lastName: string
    }
  }
  isPast?: boolean
}

export function TutorAppointmentCard({
  appointment,
  isPast = false,
}: TutorAppointmentCardProps) {
  const [isEditingLink, setIsEditingLink] = useState(false)
  const [meetingLink, setMeetingLink] = useState(appointment.meetingLink || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const duration = Math.round(
    (new Date(appointment.endDatetime).getTime() -
      new Date(appointment.startDatetime).getTime()) /
      1000 /
      60
  )

  const handleSaveLink = async () => {
    setIsSaving(true)
    setError(null)
    
    try {
      const result = await updateMeetingLink({
        appointmentId: appointment.id,
        meetingLink: meetingLink.trim()
      })
      
      if (result.success) {
        setIsEditingLink(false)
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setMeetingLink(appointment.meetingLink || '')
    setIsEditingLink(false)
    setError(null)
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base">{appointment.course.titleFr}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Étudiant: {appointment.user.firstName} {appointment.user.lastName}
          </p>
          <p className="mt-1 text-xs sm:text-sm font-medium">
            {formatDateTime(new Date(appointment.startDatetime))}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Durée: {duration} minutes
          </p>
          <div className="mt-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                appointment.status === 'scheduled'
                  ? 'bg-info-light text-info dark:bg-info/20 dark:text-info'
                  : appointment.status === 'cancelled'
                  ? 'bg-error-light text-error dark:bg-error/20 dark:text-error'
                  : appointment.status === 'completed'
                  ? 'bg-success-light text-success dark:bg-success/20 dark:text-success'
                  : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
              }`}
            >
              {appointment.status === 'scheduled' ? 'Programmé' :
               appointment.status === 'cancelled' ? 'Annulé' :
               appointment.status === 'completed' ? 'Terminé' : appointment.status}
            </span>
          </div>
          
          {/* Meeting Link Section */}
          {!isPast && appointment.status === 'scheduled' && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground">Lien de réunion</h4>
                {!isEditingLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingLink(true)}
                    className="h-6 px-2 text-xs"
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    {appointment.meetingLink ? 'Modifier' : 'Ajouter'}
                  </Button>
                )}
              </div>
              
              {isEditingLink ? (
                <div className="space-y-2">
                  <Input
                    type="url"
                    placeholder="https://zoom.us/j/123456789 ou https://teams.microsoft.com/l/meetup-join/..."
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="text-sm"
                  />
                  {error && (
                    <p className="text-xs text-error">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveLink}
                      disabled={isSaving}
                      className="h-7 px-3 text-xs"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="h-7 px-3 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  {appointment.meetingLink ? (
                    <a
                      href={appointment.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-info hover:text-info/80 underline break-all"
                    >
                      {appointment.meetingLink}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Aucun lien ajouté</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-shrink-0">
          <TutorMessageIndicator
            studentId={appointment.userId}
          />
        </div>
      </div>
    </div>
  )
}
