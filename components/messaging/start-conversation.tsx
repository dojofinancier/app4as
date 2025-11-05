'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, MessageCircle } from 'lucide-react'

interface StartConversationProps {
  onSelectTutor: (tutor: any) => void
}

export function StartConversation({ onSelectTutor }: StartConversationProps) {
  const [availableTutors, setAvailableTutors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailableTutors()
  }, [])

  const loadAvailableTutors = async () => {
    try {
      setLoading(true)
      // Get tutors from appointments - this is a simplified approach
      // In a real implementation, you'd have a dedicated API endpoint
      const response = await fetch('/api/available-tutors')
      if (response.ok) {
        const tutors = await response.json()
        setAvailableTutors(tutors)
      } else {
        // Fallback: show empty state
        setAvailableTutors([])
      }
    } catch (error) {
      console.error('Error loading tutors:', error)
      setAvailableTutors([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des tuteurs...</div>
      </div>
    )
  }

  if (availableTutors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun tuteur disponible</h3>
        <p className="text-muted-foreground">
          Vous devez avoir des rendez-vous avec un tuteur pour pouvoir lui envoyer des messages.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Commencer une nouvelle conversation</h3>
        <p className="text-muted-foreground">
          Sélectionnez un tuteur avec qui vous avez des rendez-vous pour commencer à échanger.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {availableTutors.map((tutor) => (
          <Card
            key={tutor.id}
            className="cursor-pointer hover:bg-muted transition-colors"
            onClick={() => onSelectTutor(tutor)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">
                    {tutor.firstName} {tutor.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tuteur
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {tutor.appointmentCount} rendez-vous
                    </Badge>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
