'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import { 
  getAllSupportTickets,
  getAdminsForAssignment,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  type TicketStatus,
  type TicketPriority
} from '@/lib/actions/admin'
import { AdminTicketDetailsModal } from './admin-ticket-details-modal'
import { Search, Filter, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

export function SupportTicketsManagement() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [admins, setAdmins] = useState<any[]>([])
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [assignedFilter, setAssignedFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  useEffect(() => {
    loadAdmins()
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, priorityFilter, categoryFilter, assignedFilter, searchQuery])

  const loadAdmins = async () => {
    try {
      const result = await getAdminsForAssignment()
      if (result.success && result.data) {
        setAdmins(result.data)
      }
    } catch (error) {
      console.error('Error loading admins:', error)
    }
  }

  const fetchTickets = async (cursor?: string) => {
    try {
      setLoading(true)
      const result = await getAllSupportTickets({
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        assignedTo: assignedFilter === 'all' ? undefined : assignedFilter === 'unassigned' ? 'unassigned' : assignedFilter,
        search: searchQuery || undefined,
        cursor,
        limit: 20
      })

      if (result.success && result.data) {
        if (cursor) {
          setTickets(prev => [...prev, ...result.data])
        } else {
          setTickets(result.data)
        }
        setNextCursor(result.nextCursor || null)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTicketUpdated = () => {
    setSelectedTicketId(null)
    setTickets([])
    setNextCursor(null)
    fetchTickets()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-info">Ouvert</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-warning">En cours</Badge>
      case 'resolved':
        return <Badge variant="default" className="bg-success">Résolu</Badge>
      case 'closed':
        return <Badge variant="outline">Fermé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>
      case 'high':
        return <Badge variant="default" className="bg-error">Élevé</Badge>
      case 'medium':
        return <Badge variant="default" className="bg-warning">Moyen</Badge>
      case 'low':
        return <Badge variant="secondary">Faible</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  // Calculate stats
  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    total: tickets.length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestion des tickets de support</h2>
          <p className="text-muted-foreground">
            Gérez les demandes de support des étudiants
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Ouverts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.in_progress}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Résolus</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">Fermés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Priorité</label>
              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Catégorie</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="réservations">Réservations</SelectItem>
                  <SelectItem value="soutient technique">Soutien technique</SelectItem>
                  <SelectItem value="demande de cours">Demande de cours</SelectItem>
                  <SelectItem value="changement de cours/tuteur">Changement de cours/tuteur</SelectItem>
                  <SelectItem value="paiement">Paiement</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Assignation</label>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="unassigned">Non assignés</SelectItem>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.firstName} {admin.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} trouvé{tickets.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && tickets.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Chargement...
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Aucun ticket trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{ticket.user.firstName} {ticket.user.lastName}</span>
                        <span>{ticket.user.email}</span>
                        <span>{formatDateTime(ticket.createdAt)}</span>
                        <span>{ticket.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {ticket.assignee && (
                        <Badge variant="secondary" className="text-xs">
                          Assigné à: {ticket.assignee.firstName} {ticket.assignee.lastName}
                        </Badge>
                      )}
                      {ticket.messageCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {ticket.messageCount} message{ticket.messageCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {nextCursor && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fetchTickets(nextCursor)}
                >
                  Charger plus
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <AdminTicketDetailsModal
          ticketId={selectedTicketId}
          isOpen={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onUpdate={handleTicketUpdated}
          admins={admins}
        />
      )}
    </div>
  )
}

