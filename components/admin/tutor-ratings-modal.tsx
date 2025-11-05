'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react'

interface TutorRatingsModalProps {
  tutorId: string
  tutorName: string
  isOpen: boolean
  onClose: () => void
}

export function TutorRatingsModal({ tutorId, tutorName, isOpen, onClose }: TutorRatingsModalProps) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ total: number; page: number; pageSize: number; items: any[] } | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    const params = new URLSearchParams()
    params.set('tutorId', tutorId)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    fetch(`/api/ratings/admin?${params.toString()}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [isOpen, tutorId, page, pageSize])

  const toggleHidden = async (ratingId: string, hidden: boolean) => {
    await fetch('/api/ratings/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratingId, hidden }),
    })
    // Refresh
    setLoading(true)
    const params = new URLSearchParams()
    params.set('tutorId', tutorId)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    fetch(`/api/ratings/admin?${params.toString()}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Évaluations - {tutorName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {loading && <div>Chargement…</div>}
          {!loading && data && data.items.length === 0 && (
            <div className="text-muted-foreground text-center py-8">Aucune évaluation pour ce tuteur</div>
          )}
          {!loading && data && data.items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-4 text-sm space-y-1">
                <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('fr-CA')}</div>
                <div><b>Étudiant:</b> {item.student.firstName} {item.student.lastName} ({item.student.email})</div>
                <div><b>Cours:</b> {item.course.titleFr}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>Courtoisie: {item.q1Courtoisie}</div>
                  <div>Maîtrise: {item.q2Maitrise}</div>
                  <div>Pédagogie: {item.q3Pedagogie}</div>
                  <div>Dynamisme: {item.q4Dynamisme}</div>
                </div>
                {item.comment && <div className="whitespace-pre-wrap">{item.comment}</div>}
                <div className="flex gap-2 pt-2">
                  {item.hidden ? (
                    <Button variant="outline" size="sm" onClick={() => toggleHidden(item.id, false)}>Rendre visible</Button>
                  ) : (
                    <Button variant="destructive" size="sm" onClick={() => toggleHidden(item.id, true)}>Masquer</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && data && data.total > data.pageSize && (
            <div className="flex gap-2 justify-center">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</Button>
              <Button variant="outline" disabled={(data.items?.length || 0) < pageSize} onClick={() => setPage(p => p + 1)}>Suivant</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
