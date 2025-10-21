'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getAdminRecurringSessions } from '@/lib/actions/recurring-sessions'
import { Calendar, User, Clock, DollarSign, Repeat } from 'lucide-react'

export function RecurringSessionsManagement() {
  const [recurringSessions, setRecurringSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecurringSessions = async () => {
      try {
        const result = await getAdminRecurringSessions()
        if (result.success && result.sessions) {
          setRecurringSessions(result.sessions)
        }
      } catch (error) {
        console.error('Error fetching recurring sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecurringSessions()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Sessions récurrentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recurringSessions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucune session récurrente trouvée
          </div>
        ) : (
          <div className="space-y-4">
            {recurringSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {session.user.firstName} {session.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        avec {session.tutor.user.firstName} {session.tutor.user.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {session.frequency === 'weekly' ? 'Hebdomadaire' : 'Bi-hebdomadaire'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.totalSessions} sessions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {session.durationMin === 60 ? '1h' : 
                         session.durationMin === 90 ? '1h30' : '2h'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.course.titleFr}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {session.sessionsCreated}/{session.totalSessions} créées
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.sessionsCompleted} terminées
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={session.active ? 'default' : 'secondary'}>
                      {session.active ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Détails
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
