'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Clock, User, DollarSign, Repeat } from 'lucide-react'

interface RecurringSessionFormProps {
  tutor: {
    id: string
    displayName: string
    hourlyBaseRateCad: number
  }
  course: {
    id: string
    titleFr: string
    slug: string
  }
  selectedSlot: {
    start: Date
    end: Date
  }
  duration: number
  onBook: (data: {
    frequency: 'weekly' | 'biweekly'
    totalSessions: number
    totalPrice: number
  }) => void
  onCancel: () => void
}

export function RecurringSessionForm({
  tutor,
  course,
  selectedSlot,
  duration,
  onBook,
  onCancel
}: RecurringSessionFormProps) {
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly'>('weekly')
  const [totalSessions, setTotalSessions] = useState(4)

  const calculatePrice = () => {
    const multiplier = duration === 60 ? 1 : duration === 90 ? 1.5 : 2
    const sessionPrice = Number(tutor.hourlyBaseRateCad) * multiplier
    return sessionPrice * totalSessions
  }

  const getLastSessionDate = () => {
    const startDate = new Date(selectedSlot.start)
    const weeksToAdd = frequency === 'weekly' 
      ? (totalSessions - 1) 
      : (totalSessions - 1) * 2
    
    const lastDate = new Date(startDate)
    lastDate.setDate(lastDate.getDate() + (weeksToAdd * 7))
    
    return lastDate.toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onBook({
      frequency,
      totalSessions,
      totalPrice: calculatePrice()
    })
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{tutor.displayName}</p>
                <p className="text-sm text-muted-foreground">Tuteur</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {selectedSlot.start.toLocaleDateString('fr-CA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedSlot.start.toLocaleTimeString('fr-CA', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {selectedSlot.end.toLocaleTimeString('fr-CA', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {duration === 60 ? '1 heure' : 
                   duration === 90 ? '1h30' : '2 heures'}
                </p>
                <p className="text-sm text-muted-foreground">Durée par session</p>
              </div>
            </div>
          </div>

          {/* Frequency Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Fréquence</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  frequency === 'weekly'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Hebdomadaire</div>
                <div className="text-sm text-muted-foreground">Chaque semaine</div>
              </button>
              <button
                type="button"
                onClick={() => setFrequency('biweekly')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  frequency === 'biweekly'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Bi-hebdomadaire</div>
                <div className="text-sm text-muted-foreground">Toutes les 2 semaines</div>
              </button>
            </div>
          </div>

          {/* Number of Sessions */}
          <div className="space-y-3">
            <Label htmlFor="totalSessions" className="text-base font-medium">
              Nombre de sessions (3-14)
            </Label>
            <Input
              id="totalSessions"
              type="number"
              min="3"
              max="14"
              value={totalSessions}
              onChange={(e) => setTotalSessions(parseInt(e.target.value) || 3)}
              className="w-full"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Première session:</span>
              <span className="text-sm font-medium">
                {selectedSlot.start.toLocaleDateString('fr-CA')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Dernière session:</span>
              <span className="text-sm font-medium">{getLastSessionDate()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total des sessions:</span>
              <span className="text-sm font-medium">{totalSessions}</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-medium">Total à payer</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(calculatePrice())}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Réserver les sessions
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
