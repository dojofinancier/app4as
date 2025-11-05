'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function RatingsManagement() {
  const [tutorId, setTutorId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [includeHidden, setIncludeHidden] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ total: number; page: number; pageSize: number; items: any[] } | null>(null)

  const url = useMemo(() => {
    const params = new URLSearchParams()
    if (tutorId) params.set('tutorId', tutorId)
    if (courseId) params.set('courseId', courseId)
    if (studentId) params.set('studentId', studentId)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('includeHidden', String(includeHidden))
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    return `/api/ratings/admin?${params.toString()}`
  }, [tutorId, courseId, studentId, from, to, includeHidden, page, pageSize])

  const refresh = () => {
    setLoading(true)
    fetch(url).then(r => r.json()).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [url])

  const toggleHidden = async (ratingId: string, hidden: boolean) => {
    await fetch('/api/ratings/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratingId, hidden }),
    })
    refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Évaluations (Admin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <Label>Tuteur ID</Label>
              <Input value={tutorId} onChange={e => { setTutorId(e.target.value); setPage(1) }} placeholder="tutorId" />
            </div>
            <div>
              <Label>Cours ID</Label>
              <Input value={courseId} onChange={e => { setCourseId(e.target.value); setPage(1) }} placeholder="courseId" />
            </div>
            <div>
              <Label>Étudiant ID</Label>
              <Input value={studentId} onChange={e => { setStudentId(e.target.value); setPage(1) }} placeholder="studentId" />
            </div>
            <div>
              <Label>De</Label>
              <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} />
            </div>
            <div>
              <Label>À</Label>
              <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} />
            </div>
            <div className="flex items-end gap-2">
              <Button variant={includeHidden ? 'default' : 'outline'} onClick={() => { setIncludeHidden(v => !v); setPage(1) }}>
                {includeHidden ? 'Inclure masqués: OUI' : 'Inclure masqués: NON'}
              </Button>
            </div>
          </div>
          {loading && <div>Chargement…</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résultats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!loading && data && data.items.length === 0 && (<div className="text-muted-foreground">Aucun résultat</div>)}
          {!loading && data && data.items.map(item => (
            <div key={item.id} className="rounded border p-4 text-sm space-y-1">
              <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('fr-CA')}</div>
              <div><b>Tuteur:</b> {item.tutor.displayName} ({item.tutor.id})</div>
              <div><b>Étudiant:</b> {item.student.firstName} {item.student.lastName} ({item.student.email})</div>
              <div><b>Cours:</b> {item.course.titleFr} ({item.course.id})</div>
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
            </div>
          ))}
          {!loading && data && data.total > data.pageSize && (
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</button>
              <button className="px-3 py-1 border rounded" disabled={(data.items?.length || 0) < pageSize} onClick={() => setPage(p => p + 1)}>Suivant</button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}







