'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
// Use API routes to interact with server actions

function StarInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hoverValue, setHoverValue] = useState(0)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            onMouseEnter={() => setHoverValue(v)}
            onMouseLeave={() => setHoverValue(0)}
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 rounded"
            aria-label={`${v} étoiles`}
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                (hoverValue >= v || (!hoverValue && value >= v))
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 fill-gray-100'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
        )}
      </div>
    </div>
  )
}

export function StudentRatingDialog({ tutorId, courseId, appointmentId }: { tutorId: string; courseId: string; appointmentId?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [existing, setExisting] = useState<any | null>(null)
  const [q1, setQ1] = useState(0)
  const [q2, setQ2] = useState(0)
  const [q3, setQ3] = useState(0)
  const [q4, setQ4] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    (async () => {
      setError(null)
      setSuccess(null)
      const res = await fetch(`/api/ratings/mine?tutorId=${encodeURIComponent(tutorId)}&courseId=${encodeURIComponent(courseId)}`)
      const json = await res.json()
      if (json?.success && json.data) {
        setExisting(json.data)
        setQ1(json.data.q1Courtoisie)
        setQ2(json.data.q2Maitrise)
        setQ3(json.data.q3Pedagogie)
        setQ4(json.data.q4Dynamisme)
        setComment(json.data.comment || '')
      } else {
        setExisting(null)
        setQ1(0); setQ2(0); setQ3(0); setQ4(0); setComment('')
      }
    })()
  }, [open, tutorId, courseId])

  const onSubmit = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/ratings/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId, courseId, q1Courtoisie: q1, q2Maitrise: q2, q3Pedagogie: q3, q4Dynamisme: q4, comment }),
      })
      const json = await res.json()
      if (!json?.success) setError(json?.error || 'Une erreur est survenue')
      else { setSuccess('Évaluation enregistrée'); setExisting(json.data) }
    } finally {
      setLoading(false)
    }
  }

  const hasExisting = !!existing

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {hasExisting ? 'Modifier votre évaluation' : 'Évaluer le tuteur'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Votre évaluation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <StarInput label="1) Courtoisie et professionnalisme" value={q1} onChange={setQ1} />
          <StarInput label="2) Maîtrise de la matière" value={q2} onChange={setQ2} />
          <StarInput label="3) Réponses et approche pédagogique" value={q3} onChange={setQ3} />
          <StarInput label="4) Dynamisme et motivation" value={q4} onChange={setQ4} />

          <div className="space-y-2">
            <Label>5) Vos commentaires (optionnel)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              placeholder="Partagez vos commentaires"
              className="min-h-[120px]"
            />
            <div className="text-xs text-muted-foreground text-right">{comment.length}/2000</div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
            <Button onClick={onSubmit} disabled={loading || [q1,q2,q3,q4].some(v => v < 1)}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


