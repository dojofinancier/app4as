'use client'

import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { FileAttachmentDirect } from './file-upload-direct'
import { getFileDownloadUrl } from '@/lib/actions/file-upload-direct'
import { downloadFile } from '@/lib/utils/file-download'

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    createdAt: string
    sender: {
      id: string
      firstName: string
      lastName: string
      role: string
    }
    appointment?: {
      id: string
      startDatetime: string
      course: {
        titleFr: string
      }
    } | null
    attachments?: Array<{
      id: string
      fileName: string
      fileSize: number
      fileType: string
      createdAt: string
    }>
  }
  isCurrentUser: boolean
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const senderName = `${message.sender.firstName} ${message.sender.lastName}`
  const isTutor = message.sender.role === 'tutor'

  const handleDownload = async (attachmentId: string) => {
    try {
      const result = await getFileDownloadUrl(attachmentId)
      if (result.success && result.downloadUrl) {
        // Get the attachment to get the file name
        const attachment = message.attachments?.find(att => att.id === attachmentId)
        if (attachment) {
          await downloadFile(result.downloadUrl, attachment.fileName)
        }
      } else {
        console.error('Download error:', result.error)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isCurrentUser 
          ? 'bg-primary text-primary-foreground' 
          : isTutor
          ? 'bg-blue-100 text-blue-900'
          : 'bg-gray-100 text-gray-900'
      }`}>
        {/* Sender info */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">
            {isCurrentUser ? 'Vous' : senderName}
          </span>
          {isTutor && !isCurrentUser && (
            <Badge variant="secondary" className="text-xs">
              Tuteur
            </Badge>
          )}
        </div>

        {/* Message content */}
        {message.content && (
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}

        {/* File attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <FileAttachmentDirect
                key={attachment.id}
                attachment={attachment}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}

        {/* Appointment context */}
        {message.appointment && (
          <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
            <div className="text-xs opacity-75">
              <div className="font-medium">Contexte:</div>
              <div>{message.appointment.course.titleFr}</div>
              <div>{formatDateTime(new Date(message.appointment.startDatetime))}</div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs opacity-75 mt-1">
          {formatDateTime(new Date(message.createdAt))}
        </div>
      </div>
    </div>
  )
}
