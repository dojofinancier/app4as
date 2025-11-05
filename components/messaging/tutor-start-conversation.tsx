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
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg sm:text-xl">Nouvelle conversation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">
              Aucun étudiant disponible pour le moment.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
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
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg sm:text-xl">Nouvelle conversation</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Sélectionnez un étudiant pour commencer une conversation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:gap-4">
          {availableStudents.map((student) => (
            <div
              key={student.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSelectStudent(student)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm sm:text-base truncate">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {student.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {student.appointmentCount} rendez-vous
                </Badge>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Message</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
