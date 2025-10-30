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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{appointment.course.titleFr}</h3>
          <p className="text-sm text-muted-foreground">
            Étudiant: {appointment.user.firstName} {appointment.user.lastName}
          </p>
          <p className="mt-1 text-sm font-medium">
            {formatDateTime(new Date(appointment.startDatetime))}
          </p>
          <p className="text-sm text-muted-foreground">
            Durée: {duration} minutes
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
              {appointment.status === 'scheduled' ? 'Programmé' :
               appointment.status === 'cancelled' ? 'Annulé' :
               appointment.status === 'completed' ? 'Terminé' : appointment.status}
            </span>
          </div>
          
          {/* Meeting Link Section */}
          {!isPast && appointment.status === 'scheduled' && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Lien de réunion</h4>
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
                    <p className="text-xs text-red-600">{error}</p>
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
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {appointment.meetingLink}
                    </a>
                  ) : (
                    <span className="text-gray-500 italic">Aucun lien ajouté</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <TutorMessageIndicator
            studentId={appointment.userId}
          />
        </div>
      </div>
    </div>
  )
}
