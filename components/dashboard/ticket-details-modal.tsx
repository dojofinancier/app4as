'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  getTicketDetails, 
  addTicketMessage, 
  closeTicket
} from '@/lib/actions/support-tickets'
import { getTicketAttachmentDownloadUrl } from '@/lib/actions/ticket-attachments'
import { formatDateTime } from '@/lib/utils'
import { Loader2, Send, XCircle, Download, Paperclip } from 'lucide-react'

interface TicketDetailsModalProps {
  ticketId: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function TicketDetailsModal({ ticketId, isOpen, onClose, onUpdate }: TicketDetailsModalProps) {
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && ticketId) {
      // Reset state before loading
      setTicket(null)
      setError(null)
      setMessage('')
      loadTicket()
    } else if (!isOpen) {
      // Reset state when modal closes
      setTicket(null)
      setError(null)
      setMessage('')
      setLoading(false)
    }
  }, [isOpen, ticketId])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const loadTicket = async () => {
    if (!ticketId || ticketId.trim() === '') {
      setError('Aucun ID de ticket fourni')
      setLoading(false)
      setTicket(null)
      return
    }

    setLoading(true)
    setError(null)
    setTicket(null)
    
    try {
      console.log('Loading ticket with ID:', ticketId)
      const result = await getTicketDetails(ticketId)
      console.log('Ticket details result:', result)
      
      if (result.success && result.data) {
        setTicket(result.data)
        setError(null)
      } else {
        const errorMsg = result.error || 'Erreur lors du chargement du ticket'
        console.error('Failed to load ticket:', errorMsg)
        setError(errorMsg)
        setTicket(null)
      }
    } catch (error) {
      console.error('Error loading ticket:', error)
      setError('Une erreur est survenue lors du chargement du ticket')
      setTicket(null)
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
      const result = await addTicketMessage(ticketId, message.trim())
      if (result.success) {
        setMessage('')
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

  const handleCloseTicket = async () => {
    if (!confirm('Êtes-vous sûr de vouloir fermer ce ticket ?')) {
      return
    }

    setClosing(true)
    setError(null)

    try {
      const result = await closeTicket(ticketId)
      if (result.success) {
        await loadTicket()
        onUpdate()
      } else {
        setError(result.error || 'Erreur lors de la fermeture du ticket')
      }
    } catch (error) {
      console.error('Error closing ticket:', error)
      setError('Une erreur est survenue')
    } finally {
      setClosing(false)
    }
  }

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const result = await getTicketAttachmentDownloadUrl(attachmentId)
      if (result.success && result.downloadUrl) {
        // Create a temporary link and click it
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

  const canReply = ticket?.status !== 'closed' && ticket?.status !== 'resolved'

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargement du ticket</DialogTitle>
            <DialogDescription>
              Veuillez patienter pendant le chargement des détails du ticket.
            </DialogDescription>
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
            <DialogTitle>Ticket non trouvé</DialogTitle>
            <DialogDescription>
              {error || 'Le ticket demandé est introuvable ou vous n\'avez pas l\'autorisation d\'y accéder.'}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <Button onClick={onClose} variant="outline">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {ticket.subject}
                {getStatusBadge(ticket.status)}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-2 text-sm space-y-1">
                  <div>Catégorie: {ticket.category}</div>
                  <div>Créé le: {formatDateTime(ticket.createdAt)}</div>
                  {ticket.resolvedAt && (
                    <div>Résolu le: {formatDateTime(ticket.resolvedAt)}</div>
                  )}
                  {ticket.assignedTo && ticket.assignee && (
                    <div>Assigné à: {ticket.assignee.firstName} {ticket.assignee.lastName}</div>
                  )}
                </div>
              </DialogDescription>
            </div>
            {canReply && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseTicket}
                disabled={closing}
              >
                {closing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fermeture...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Fermer le ticket
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {error && (
            <div className="p-3 bg-error-light border border-error-border rounded-md text-error text-sm">
              {error}
            </div>
          )}

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
                      msg.user.role === 'admin' ? 'bg-info-light' : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {msg.user.role === 'admin' ? 'Support' : 'Vous'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {msg.user.role === 'admin' ? 'Admin' : 'Étudiant'}
                        </Badge>
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
        {canReply && (
          <div className="border-t pt-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Tapez votre message..."
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
        )}

        {!canReply && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Ce ticket est fermé. Créez un nouveau ticket si vous avez besoin d'aide supplémentaire.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

