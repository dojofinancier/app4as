'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface TutorRatingsTabProps {
  tutorId: string
  courses?: Array<{ id: string; titleFr: string }>
}

export function TutorRatingsTab({ tutorId, courses = [] }: TutorRatingsTabProps) {
  const [courseId, setCourseId] = useState<string | undefined>(undefined)
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [averages, setAverages] = useState<any>(null)
  const [list, setList] = useState<{ total: number; page: number; pageSize: number; items: any[] } | null>(null)

  const url = useMemo(() => {
    const params = new URLSearchParams()
    params.set('tutorId', tutorId)
    if (courseId) params.set('courseId', courseId)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    return `/api/ratings/tutor?${params.toString()}`
  }, [tutorId, courseId, from, to, page, pageSize])

  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setAverages(data.averages)
        setList(data.list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [url])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Évaluations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Cours</Label>
              <Select onValueChange={(v) => { setCourseId(v === 'all' ? undefined : v); setPage(1) }} value={courseId || 'all'}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.titleFr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>De</Label>
              <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
            </div>
            <div>
              <Label>À</Label>
              <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
            </div>
          </div>

          {loading && <div>Chargement…</div>}
          {!loading && averages && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              <Stat label="Nombre" value={averages.count} />
              <Stat label="Courtoisie" value={averages.avgQ1.toFixed(2)} />
              <Stat label="Maîtrise" value={averages.avgQ2.toFixed(2)} />
              <Stat label="Pédagogie" value={averages.avgQ3.toFixed(2)} />
              <Stat label="Dynamisme" value={averages.avgQ4.toFixed(2)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commentaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && list && list.items.length === 0 && (
            <div className="text-muted-foreground">Aucune évaluation</div>
          )}
          {!loading && list && list.items.map(item => (
            <div key={item.id} className="rounded border p-3 sm:p-4 space-y-2">
              <div className="text-xs sm:text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('fr-CA')}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                <div>Courtoisie: {item.q1Courtoisie}</div>
                <div>Maîtrise: {item.q2Maitrise}</div>
                <div>Pédagogie: {item.q3Pedagogie}</div>
                <div>Dynamisme: {item.q4Dynamisme}</div>
              </div>
              {item.comment && (
                <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">{item.comment}</div>
              )}
            </div>
          ))}
          {!loading && list && list.total > list.pageSize && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="px-3 py-1 border rounded text-sm w-full sm:w-auto" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</button>
              <button className="px-3 py-1 border rounded text-sm w-full sm:w-auto" disabled={list.items.length < pageSize} onClick={() => setPage(p => p + 1)}>Suivant</button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}



