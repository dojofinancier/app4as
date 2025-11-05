'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { 
  getStudentTickets
} from '@/lib/actions/support-tickets'
import { TICKET_CATEGORIES, type TicketCategory } from '@/lib/constants/ticket-categories'
import { CreateTicketModal } from './create-ticket-modal'
import { TicketDetailsModal } from './ticket-details-modal'
import { Plus, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'

interface SupportTicketsTabProps {
  userId: string
}

export function SupportTicketsTab({ userId }: SupportTicketsTabProps) {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const fetchTickets = async (cursor?: string) => {
    try {
      const result = await getStudentTickets({
        status: statusFilter === 'all' ? undefined : statusFilter,
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

  useEffect(() => {
    setLoading(true)
    setTickets([])
    setNextCursor(null)
    fetchTickets()
  }, [statusFilter])

  const handleTicketCreated = () => {
    setShowCreateModal(false)
    setTickets([])
    setNextCursor(null)
    fetchTickets()
  }

  const handleTicketUpdated = () => {
    setSelectedTicketId(null)
    setTickets([])
    setNextCursor(null)
    fetchTickets()
  }

  // Calculate stats
  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    total: tickets.length
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

  const getCategoryLabel = (category: string) => {
    return category
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Tickets de support</h2>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Tickets de support</h2>
          <p className="text-muted-foreground">
            Gérez vos demandes de support
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau ticket
        </Button>
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

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Tous
        </Button>
        <Button
          variant={statusFilter === 'open' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('open')}
        >
          Ouverts
        </Button>
        <Button
          variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('in_progress')}
        >
          En cours
        </Button>
        <Button
          variant={statusFilter === 'resolved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('resolved')}
        >
          Résolus
        </Button>
        <Button
          variant={statusFilter === 'closed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('closed')}
        >
          Fermés
        </Button>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Mes tickets</CardTitle>
          <CardDescription>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} trouvé{tickets.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun ticket trouvé</p>
              <Button 
                className="mt-4" 
                onClick={() => setShowCreateModal(true)}
              >
                Créer un ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                if (!ticket.id) {
                  console.error('Ticket without ID:', ticket)
                  return null
                }
                return (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onSelect={() => {
                      console.log('Selecting ticket with ID:', ticket.id)
                      setSelectedTicketId(ticket.id)
                    }}
                    getStatusBadge={getStatusBadge}
                    getCategoryLabel={getCategoryLabel}
                  />
                )
              })}
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTicketCreated}
        />
      )}

      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <TicketDetailsModal
          ticketId={selectedTicketId}
          isOpen={!!selectedTicketId}
          onClose={() => {
            console.log('Closing modal, ticketId was:', selectedTicketId)
            setSelectedTicketId(null)
          }}
          onUpdate={handleTicketUpdated}
        />
      )}
    </div>
  )
}

// Ticket Card Component
function TicketCard({ 
  ticket, 
  onSelect,
  getStatusBadge,
  getCategoryLabel 
}: { 
  ticket: any
  onSelect: () => void
  getStatusBadge: (status: string) => JSX.Element
  getCategoryLabel: (category: string) => string
}) {
  return (
    <div
      className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{ticket.subject}</h3>
            {getStatusBadge(ticket.status)}
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {ticket.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(ticket.createdAt)}
            </span>
            {ticket.lastMessageDate && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Dernière réponse: {formatDateTime(ticket.lastMessageDate)}
              </span>
            )}
            <span>{getCategoryLabel(ticket.category)}</span>
            {ticket.assignedTo && (
              <Badge variant="secondary" className="text-xs">
                Assigné
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {ticket.messageCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {ticket.messageCount} message{ticket.messageCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

