'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { getConversations } from '@/lib/actions/messaging'
import { MessageCircle, User } from 'lucide-react'

interface ConversationsListProps {
  onSelectConversation: (participant: any) => void
}

export function ConversationsList({ onSelectConversation }: ConversationsListProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = async () => {
    try {
      setLoading(true)
      const result = await getConversations()
      if (result.success && result.conversations) {
        setConversations(result.conversations)
      } else {
        setError(result.error || 'Erreur lors du chargement des conversations')
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des conversations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune conversation</h3>
        <p className="text-muted-foreground">
          Vous n'avez pas encore de messages avec vos tuteurs.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Card
          key={conversation.participant.id}
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onSelectConversation(conversation.participant)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">
                    {conversation.participant.firstName} {conversation.participant.lastName}
                  </h3>
                  {conversation.participant.role === 'tutor' && (
                    <Badge variant="secondary" className="text-xs">
                      Tuteur
                    </Badge>
                  )}
                  {conversation.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>

                {conversation.latestMessage ? (
                  <>
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {conversation.latestMessage.sender.isCurrentUser ? 'Vous: ' : ''}
                      {conversation.latestMessage.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(new Date(conversation.latestMessage.createdAt))}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun message
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
