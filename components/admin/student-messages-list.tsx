'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/utils'
import { 
  MessageSquare, 
  User, 
  Calendar,
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { getStudentMessages } from '@/lib/actions/admin'

interface StudentMessagesListProps {
  studentId: string
}

interface Message {
  id: string
  content: string
  createdAt: Date
  sender: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  receiver: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  appointment?: {
    id: string
    startDatetime: Date
    course: {
      titleFr: string
    }
  }
}

export function StudentMessagesList({ studentId }: StudentMessagesListProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async (cursor?: string, append = false) => {
    if (!studentId) return

    const loadingState = append ? setLoadingMore : setLoading
    loadingState(true)
    setError(null)

    try {
      const result = await getStudentMessages(studentId, {
        cursor,
        limit: 20
      })

      if (result.success && result.data) {
        const newMessages = result.data.messages.map(msg => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          appointment: msg.appointment ? {
            ...msg.appointment,
            startDatetime: new Date(msg.appointment.startDatetime)
          } : undefined
        }))

        if (append) {
          setMessages(prev => [...prev, ...newMessages])
        } else {
          setMessages(newMessages)
        }

        setHasMore(result.data.hasMore)
        setNextCursor(result.data.nextCursor)
      } else {
        setError(result.error || 'Erreur lors du chargement des messages')
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Une erreur est survenue')
    } finally {
      loadingState(false)
      setInitialLoad(false)
    }
  }

  const loadMore = () => {
    if (hasMore && nextCursor && !loadingMore) {
      fetchMessages(nextCursor, true)
    }
  }

  // Load messages on mount
  useEffect(() => {
    fetchMessages()
  }, [studentId])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, nextCursor])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'student':
        return <Badge variant="default" className="bg-info-light text-info">Étudiant</Badge>
      case 'tutor':
        return <Badge variant="default" className="bg-success-light text-success">Tuteur</Badge>
      case 'admin':
        return <Badge variant="default" className="bg-primary/10 text-primary">Admin</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const isStudentMessage = (message: Message) => {
    return message.sender.id === studentId
  }

  if (initialLoad && loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className={i % 2 === 0 ? 'ml-8 bg-info-light' : 'mr-8 bg-muted'}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 rounded-full mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6">
        {error ? (
          <div className="text-center text-destructive py-8">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun message trouvé</p>
            <p className="text-sm">Cet étudiant n'a pas encore échangé de messages.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id} className={`${isStudentMessage(message) ? 'ml-8 bg-info-light' : 'mr-8 bg-muted'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Message Direction Indicator */}
                    <div className="flex-shrink-0 mt-1">
                      {isStudentMessage(message) ? (
                        <ArrowRight className="h-4 w-4 text-info" />
                      ) : (
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Message Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {message.sender.firstName} {message.sender.lastName}
                        </span>
                        {getRoleBadge(message.sender.role)}
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div className="mb-3">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Appointment Context */}
                      {message.appointment && (
                        <div className="mt-3 p-2 bg-white border rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Contexte du rendez-vous:</span>
                          </div>
                          <p className="text-sm font-medium mt-1">
                            {message.appointment.course.titleFr}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(message.appointment.startDatetime)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4">
                {loadingMore ? (
                  <div className="text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Chargement...
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="w-full"
                  >
                    Charger plus
                  </Button>
                )}
              </div>
            )}

            {!hasMore && messages.length > 0 && (
              <div className="text-center text-muted-foreground py-4 text-sm">
                Tous les messages ont été chargés
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
