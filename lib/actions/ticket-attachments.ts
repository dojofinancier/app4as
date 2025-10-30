'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'

const MAX_FILE_SIZE = 32 * 1024 * 1024 // 32MB in bytes
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp'
]

/**
 * Upload attachment for a support ticket
 */
export async function uploadTicketAttachment(
  ticketId: string,
  fileData: {
    name: string
    size: number
    type: string
    base64: string
  }
): Promise<{ success: boolean; error?: string; attachmentId?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Validate file size
    if (fileData.size > MAX_FILE_SIZE) {
      return { 
        success: false, 
        error: `Le fichier est trop volumineux. Taille maximale: 32MB` 
      }
    }

    // Validate file type
    const fileExtension = '.' + fileData.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return { 
        success: false, 
        error: `Type de fichier non supporté. Types autorisés: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP` 
      }
    }

    // Verify ticket exists and user has access
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId: currentUser.id // Students can only upload to their own tickets
      }
    })

    if (!ticket) {
      // Check if user is admin (admins can upload to any ticket)
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { role: true }
      })

      if (dbUser?.role !== 'admin') {
        return { success: false, error: 'Ticket non trouvé ou accès refusé' }
      }

      // Verify ticket exists (for admin)
      const adminTicket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      })

      if (!adminTicket) {
        return { success: false, error: 'Ticket non trouvé' }
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Generate unique file path (use same bucket as messages)
    const timestamp = Date.now()
    const sanitizedFileName = fileData.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `ticket-attachments/${ticketId}/${timestamp}_${sanitizedFileName}`

    // Convert base64 to Blob for Supabase
    const binaryString = atob(fileData.base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const fileBlob = new Blob([bytes], { type: fileData.type })

    // Upload file to Supabase Storage (same bucket as messages)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(filePath, fileBlob, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return { 
        success: false, 
        error: `Erreur lors du téléchargement du fichier: ${uploadError.message}` 
      }
    }

    // Save attachment record to database
    try {
      const attachment = await prisma.ticketAttachment.create({
        data: {
          ticketId,
          fileName: fileData.name,
          fileSize: fileData.size,
          fileType: fileData.type,
          filePath: uploadData.path
        }
      })

      return { 
        success: true, 
        attachmentId: attachment.id 
      }
    } catch (dbError) {
      console.error('Database save error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage
        .from('message-attachments')
        .remove([filePath])
      
      return { 
        success: false, 
        error: `Erreur lors de la sauvegarde: ${dbError instanceof Error ? dbError.message : 'Erreur inconnue'}` 
      }
    }
  } catch (error) {
    console.error('File upload error:', error)
    return { 
      success: false, 
      error: 'Une erreur est survenue lors du téléchargement' 
    }
  }
}

/**
 * Get download URL for ticket attachment
 */
export async function getTicketAttachmentDownloadUrl(
  attachmentId: string
): Promise<{ success: boolean; error?: string; downloadUrl?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Get attachment
    const attachment = await prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!attachment) {
      return { success: false, error: 'Pièce jointe non trouvée' }
    }

    // Verify user has access (student owns ticket or user is admin)
    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    })

    const hasAccess = 
      attachment.ticket.userId === currentUser.id || 
      dbUser?.role === 'admin'

    if (!hasAccess) {
      return { success: false, error: 'Accès refusé' }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(attachment.filePath, 3600)

    if (error) {
      console.error('Error generating signed URL:', error)
      return { success: false, error: 'Erreur lors de la génération du lien de téléchargement' }
    }

    return { success: true, downloadUrl: data.signedUrl }
  } catch (error) {
    console.error('Error getting download URL:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Upload attachment directly from File object (for client-side uploads)
 */
export async function saveTicketAttachmentMetadata(data: {
  ticketId: string
  fileName: string
  fileSize: number
  fileType: string
  filePath: string
}): Promise<{ success: boolean; error?: string; attachmentId?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Verify ticket access
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: data.ticketId,
        userId: currentUser.id
      }
    })

    if (!ticket) {
      // Check if admin
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { role: true }
      })

      if (dbUser?.role !== 'admin') {
        return { success: false, error: 'Ticket non trouvé ou accès refusé' }
      }

      // Verify ticket exists
      const adminTicket = await prisma.supportTicket.findUnique({
        where: { id: data.ticketId }
      })

      if (!adminTicket) {
        return { success: false, error: 'Ticket non trouvé' }
      }
    }

    // Create attachment record
    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId: data.ticketId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        filePath: data.filePath
      }
    })

    return { success: true, attachmentId: attachment.id }
  } catch (error) {
    console.error('Error saving attachment metadata:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Une erreur est survenue' 
    }
  }
}

