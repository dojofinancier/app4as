'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, MessageCircle, ArrowLeft } from 'lucide-react'
import { getTutorStudents } from '@/lib/actions/messaging'

interface TutorStartConversationProps {
  onSelectStudent: (student: any) => void
  onBack: () => void
}

export function TutorStartConversation({ onSelectStudent, onBack }: TutorStartConversationProps) {
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailableStudents()
  }, [])

  const loadAvailableStudents = async () => {
    try {
      setLoading(true)
      const result = await getTutorStudents()
      if (result.success && result.students) {
        setAvailableStudents(result.students)
      } else {
        setAvailableStudents([])
      }
    } catch (error) {
      console.error('Error loading students:', error)
      setAvailableStudents([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des étudiants...</div>
      </div>
    )
  }

  if (availableStudents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Nouvelle conversation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun étudiant disponible pour le moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Les étudiants apparaîtront ici une fois qu'ils auront pris des rendez-vous avec vous.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Nouvelle conversation</CardTitle>
        </div>
        <CardDescription>
          Sélectionnez un étudiant pour commencer une conversation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {availableStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSelectStudent(student)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {student.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {student.appointmentCount} rendez-vous
                </Badge>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
