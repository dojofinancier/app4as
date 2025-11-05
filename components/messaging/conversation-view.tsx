'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageBubble } from './message-bubble'
import { FileUploadDirect, ErrorNotification } from './file-upload-direct'
import { sendMessage, getConversation } from '@/lib/actions/messaging'
import { Send, ArrowLeft, Paperclip } from 'lucide-react'

const messageSchema = z.object({
  content: z.string().max(1000, 'Le message est trop long').optional()
})

type MessageFormData = z.infer<typeof messageSchema>

interface ConversationViewProps {
  participant: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  onBack: () => void
}

export function ConversationView({ participant, onBack }: ConversationViewProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: ''
    }
  })

  const messageContent = watch('content')

  const loadMessages = async () => {
    try {
      setLoading(true)
      const result = await getConversation(participant.id)
      if (result.success && result.messages) {
        setMessages(result.messages)
      } else {
        setError(result.error || 'Erreur lors du chargement des messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [participant.id])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onSubmit = async (data: MessageFormData) => {
    try {
      setSending(true)
      setError(null)

      // Check if we have content
      if (!data.content) {
        setError('Veuillez ajouter un message')
        setSending(false)
        return
      }

      // Send the message
      const result = await sendMessage({
        receiverId: participant.id,
        content: data.content
      })

      if (result.success && result.message) {
        // Transform the returned message to match the format expected by MessageBubble
        const newMessage = {
          ...result.message,
          // Serialize dates from Prisma Date objects to ISO strings
          createdAt: result.message.createdAt instanceof Date 
            ? result.message.createdAt.toISOString() 
            : typeof result.message.createdAt === 'string'
            ? result.message.createdAt
            : new Date().toISOString(),
          appointment: result.message.appointment ? {
            ...result.message.appointment,
            startDatetime: result.message.appointment.startDatetime instanceof Date
              ? result.message.appointment.startDatetime.toISOString()
              : result.message.appointment.startDatetime
          } : null,
          // Ensure attachments array exists (new messages won't have attachments yet)
          attachments: result.message.attachments || []
        }

        // Append the new message to the messages array
        setMessages(prev => [...prev, newMessage])
        
        // Clear the form
        reset({ content: '' })
      } else {
        setError(result.error || 'Erreur lors de l\'envoi du message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Une erreur est survenue')
    } finally {
      setSending(false)
    }
  }

  const handleFileUploadComplete = async (attachmentId: string) => {
    try {
      console.log('File uploaded successfully:', attachmentId)
      setShowFileUpload(false)
      // Reload messages to show the new attachment
      await loadMessages()
    } catch (error) {
      console.error('Error handling file upload completion:', error)
      setError('Une erreur est survenue lors du téléchargement du fichier')
    }
  }

  const handleFileUploadError = (error: string) => {
    setError(error)
  }

  const handleToggleFileUpload = () => {
    setShowFileUpload(!showFileUpload)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des messages...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-semibold">
            {participant.firstName} {participant.lastName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {participant.role === 'tutor' ? 'Tuteur' : 'Étudiant'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          // Skeleton loading state
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} mb-4`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  i % 2 === 0 ? 'bg-muted' : 'bg-primary/20'
                }`}>
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
            ))}
          </>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Aucun message dans cette conversation
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.sender.id === participant.id ? false : true}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2">
          <ErrorNotification 
            message={error} 
            onDismiss={() => setError(null)} 
          />
        </div>
      )}

      {/* File upload section */}
      {showFileUpload && (
        <div className="p-4 border-t bg-muted">
          <FileUploadDirect
            messageId={messages.length > 0 ? messages[messages.length - 1].id : ''}
            onUploadComplete={handleFileUploadComplete}
            onUploadError={handleFileUploadError}
          />
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-end">
          <Textarea
            {...register('content')}
            placeholder="Tapez votre message... (Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne)"
            disabled={sending}
            className="flex-1 min-h-[60px] max-h-[200px] resize-none"
            rows={2}
            onKeyDown={(e) => {
              // Submit on Enter, allow Shift+Enter for new line
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (messageContent?.trim()) {
                  handleSubmit(onSubmit)()
                }
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleFileUpload}
              disabled={sending}
              className="h-9"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="submit" disabled={sending || !messageContent?.trim()} size="sm" className="h-9">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
        {errors.content && (
          <p className="text-sm text-error mt-1">{errors.content.message}</p>
        )}
      </div>
    </div>
  )
}
