'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createSupportTicket, getStudentAppointmentsForTicket, getStudentOrdersForTicket } from '@/lib/actions/support-tickets'
import { TICKET_CATEGORIES, type TicketCategory } from '@/lib/constants/ticket-categories'
import { uploadTicketAttachment } from '@/lib/actions/ticket-attachments'
import { formatDateTime } from '@/lib/utils'
import { Loader2, Paperclip, X } from 'lucide-react'

interface CreateTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TicketCategory>('autre')
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [_appointments, setAppointments] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [_loadingAppointments, setLoadingAppointments] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load appointments and orders when modal opens
      loadAppointments()
      loadOrders()
    } else {
      // Reset form when modal closes
      setSubject('')
      setDescription('')
      setCategory('autre')
      setAppointmentId(null)
      setOrderId(null)
      setSelectedFiles([])
      setError(null)
    }
  }, [isOpen])

  const loadAppointments = async () => {
    setLoadingAppointments(true)
    try {
      const result = await getStudentAppointmentsForTicket()
      if (result.success && result.data) {
        setAppointments(result.data)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoadingAppointments(false)
    }
  }

  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const result = await getStudentOrdersForTicket()
      if (result.success && result.data) {
        setOrders(result.data)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const maxSize = 32 * 1024 * 1024 // 32MB
      if (file.size > maxSize) {
        setError(`Le fichier ${file.name} est trop volumineux (max 32MB)`)
        return false
      }
      return true
    })
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (ticketId: string): Promise<string[]> => {
    const uploadedIds: string[] = []
    
    for (const file of selectedFiles) {
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            const base64String = result.split(',')[1]
            resolve(base64String)
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const result = await uploadTicketAttachment(ticketId, {
          name: file.name,
          size: file.size,
          type: file.type,
          base64
        })

        if (result.success && result.attachmentId) {
          uploadedIds.push(result.attachmentId)
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        throw new Error(`Erreur lors du téléchargement de ${file.name}`)
      }
    }

    return uploadedIds
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!subject.trim()) {
      setError('Le sujet est requis')
      return
    }

    if (!description.trim()) {
      setError('La description est requise')
      return
    }

    setLoading(true)
    setUploadingFiles(true)

    try {
      // Create ticket
      const ticketResult = await createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        appointmentId: appointmentId || undefined,
        orderId: orderId || undefined
      })

      if (!ticketResult.success) {
        setError(ticketResult.error || 'Erreur lors de la création du ticket')
        setLoading(false)
        setUploadingFiles(false)
        return
      }

      // Upload files if any
      if (selectedFiles.length > 0 && ticketResult.data) {
        try {
          await uploadFiles(ticketResult.data.id)
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError)
          // Don't fail the ticket creation if file upload fails
          setError('Le ticket a été créé mais certains fichiers n\'ont pas pu être téléchargés')
        }
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating ticket:', error)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
      setUploadingFiles(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau ticket de support</DialogTitle>
          <DialogDescription>
            Créez un nouveau ticket de support pour obtenir de l'aide
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-error-light border border-error-border rounded-md text-error text-sm">
              {error}
            </div>
          )}

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Résumé de votre demande"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {subject.length}/200 caractères
            </p>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as TicketCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TICKET_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre problème ou votre demande en détail..."
              rows={6}
              maxLength={5000}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/5000 caractères
            </p>
          </div>

          {/* Link to Appointment - temporarily disabled */}

          {/* Link to Order */}
          <div>
            <Label htmlFor="order">Lier à une commande (optionnel)</Label>
            {loadingOrders ? (
              <div className="text-sm text-muted-foreground">Chargement...</div>
            ) : (
              <Select 
                value={orderId ?? 'none'} 
                onValueChange={(value) => setOrderId(value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une commande" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune commande</SelectItem>
                  {orders.map((order) => {
                    const price = typeof order.total === 'number' ? order.total : (order.totalCad ?? order.total)
                    const formattedPrice = price != null ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(price)) : ''
                    const label = order.label || `Commande #${order.id.slice(0, 8)} — ${formattedPrice} — ${formatDateTime(order.createdAt)}`
                    return (
                      <SelectItem key={order.id} value={order.id}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="files">Pièces jointes (optionnel)</Label>
            <div className="space-y-2">
              <Input
                id="files"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileSelect}
                disabled={uploadingFiles}
              />
              <p className="text-xs text-muted-foreground">
                Formats acceptés: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP (max 32MB par fichier)
              </p>
              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || uploadingFiles}>
              {loading || uploadingFiles ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le ticket'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

