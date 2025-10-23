'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [pendingMessage, setPendingMessage] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema)
  })

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

      console.log('Submitting message:', { content: data.content })

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

      console.log('Message send result:', result)

      if (result.success) {
        reset()
        setPendingMessage('')
        // Reload messages to get the new one
        await loadMessages()
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
        {messages.length === 0 ? (
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
        <div className="p-4 border-t bg-gray-50">
          <FileUploadDirect
            messageId={messages.length > 0 ? messages[messages.length - 1].id : ''}
            onUploadComplete={handleFileUploadComplete}
            onUploadError={handleFileUploadError}
          />
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t">
        <form onSubmit={(e) => {
          console.log('Form submitted')
          handleSubmit(onSubmit)(e)
        }} className="flex gap-2">
          <Input
            {...register('content')}
            placeholder="Tapez votre message..."
            disabled={sending}
            className="flex-1"
            value={pendingMessage}
            onChange={(e) => setPendingMessage(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleFileUpload}
            disabled={sending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button type="submit" disabled={sending} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {errors.content && (
          <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
        )}
      </div>
    </div>
  )
}
