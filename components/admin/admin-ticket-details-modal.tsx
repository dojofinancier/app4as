'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  getTicketDetailsAdmin, 
  addTicketMessageAdmin,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket
} from '@/lib/actions/admin'
import { type TicketStatus, type TicketPriority } from '@prisma/client'
import { getTicketAttachmentDownloadUrl } from '@/lib/actions/ticket-attachments'
import { formatDateTime } from '@/lib/utils'
import { Loader2, Send, Download, Paperclip, Lock } from 'lucide-react'

interface AdminTicketDetailsModalProps {
  ticketId: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  admins: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
  }>
}

export function AdminTicketDetailsModal({ 
  ticketId, 
  isOpen, 
  onClose, 
  onUpdate,
  admins 
}: AdminTicketDetailsModalProps) {
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [updatingAssignment, setUpdatingAssignment] = useState(false)
  const [message, setMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicket()
    }
  }, [isOpen, ticketId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const loadTicket = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getTicketDetailsAdmin(ticketId)
      if (result.success && result.data) {
        setTicket(result.data)
      } else {
        setError(result.error || 'Erreur lors du chargement du ticket')
      }
    } catch (error) {
      console.error('Error loading ticket:', error)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError('Veuillez saisir un message')
      return
    }

    setSending(true)
    setError(null)

    try {
      const result = await addTicketMessageAdmin(ticketId, message.trim(), isInternal)
      if (result.success) {
        setMessage('')
        setIsInternal(false)
        await loadTicket()
        onUpdate()
      } else {
        setError(result.error || 'Erreur lors de l\'envoi du message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Une erreur est survenue')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setUpdatingStatus(true)
    setError(null)

    try {
      const result = await updateTicketStatus(ticketId, newStatus)
      if (result.success) {
        await loadTicket()
        onUpdate()
      } else {
        setError(result.error || 'Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setError('Une erreur est survenue')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    setUpdatingPriority(true)
    setError(null)

    try {
      const result = await updateTicketPriority(ticketId, newPriority)
      if (result.success) {
        await loadTicket()
        onUpdate()
      } else {
        setError(result.error || 'Erreur lors de la mise à jour de la priorité')
      }
    } catch (error) {
      console.error('Error updating priority:', error)
      setError('Une erreur est survenue')
    } finally {
      setUpdatingPriority(false)
    }
  }

  const handleAssignmentChange = async (adminId: string | null) => {
    setUpdatingAssignment(true)
    setError(null)

    try {
      const result = await assignTicket(ticketId, adminId)
      if (result.success) {
        await loadTicket()
        onUpdate()
      } else {
        setError(result.error || 'Erreur lors de l\'assignation')
      }
    } catch (error) {
      console.error('Error assigning ticket:', error)
      setError('Une erreur est survenue')
    } finally {
      setUpdatingAssignment(false)
    }
  }

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const result = await getTicketAttachmentDownloadUrl(attachmentId)
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        setError(result.error || 'Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Error downloading attachment:', error)
      setError('Une erreur est survenue')
    }
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

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargement du ticket…</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!ticket) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Ticket non trouvé</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 mb-2">
                {ticket.subject}
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
              </DialogTitle>
              <DialogDescription className="mt-2">
                <div className="text-sm space-y-1">
                  <div>De: {ticket.user.firstName} {ticket.user.lastName} ({ticket.user.email})</div>
                  <div>Catégorie: {ticket.category}</div>
                  <div>Créé le: {formatDateTime(ticket.createdAt)}</div>
                  {ticket.resolvedAt && (
                    <div>Résolu le: {formatDateTime(ticket.resolvedAt)}</div>
                  )}
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {error && (
            <div className="p-3 bg-error-light border border-error-border rounded-md text-error text-sm">
              {error}
            </div>
          )}

          {/* Admin Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/50">
            <div>
              <Label className="text-sm font-medium mb-2 block">Statut</Label>
              <Select
                value={ticket.status}
                onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                disabled={updatingStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Priorité</Label>
              <Select
                value={ticket.priority}
                onValueChange={(value) => handlePriorityChange(value as TicketPriority)}
                disabled={updatingPriority}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Assigner à</Label>
              <Select
                value={ticket.assignedTo || 'unassigned'}
                onValueChange={(value) => handleAssignmentChange(value === 'unassigned' ? null : value)}
                disabled={updatingAssignment}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Non assigné</SelectItem>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.firstName} {admin.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Initial Description */}
          <div className="border rounded-lg p-4">
            <div className="text-sm font-semibold mb-2">Description initiale</div>
            <div className="text-sm whitespace-pre-wrap">{ticket.description}</div>
            
            {/* Initial Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold">Pièces jointes:</div>
                {ticket.attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm">{attachment.fileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="space-y-4">
            <div className="text-sm font-semibold">Messages</div>
            {ticket.messages && ticket.messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucun message
              </div>
            ) : (
              <div className="space-y-3">
                {ticket.messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`border rounded-lg p-4 ${
                      msg.isInternal 
                        ? 'bg-primary/10 border-primary/20' 
                        : msg.user.role === 'admin' 
                        ? 'bg-info-light' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {msg.user.role === 'admin' ? 'Support' : `${msg.user.firstName} ${msg.user.lastName}`}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {msg.user.role === 'admin' ? 'Admin' : 'Étudiant'}
                        </Badge>
                        {msg.isInternal && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Interne
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Reply Form */}
        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="internal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="internal" className="text-sm cursor-pointer">
                Note interne (ne sera pas visible par l'étudiant)
              </Label>
            </div>
            <Textarea
              placeholder={isInternal ? "Note interne..." : "Tapez votre message..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={5000}
              disabled={sending}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {message.length}/5000 caractères
              </p>
              <Button
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

