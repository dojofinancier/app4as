'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'

export async function saveAttachmentMetadata(data: {
  messageId: string
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

    // Verify message exists and user has access
    const message = await prisma.message.findFirst({
      where: {
        id: data.messageId,
        OR: [
          { senderId: currentUser.id },
          { receiverId: currentUser.id }
        ]
      }
    })

    if (!message) {
      return { success: false, error: 'Message non trouvé ou accès refusé' }
    }

    // Save attachment metadata to database
    const attachment = await prisma.messageAttachment.create({
      data: {
        messageId: data.messageId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        filePath: data.filePath
      }
    })

    return { 
      success: true, 
      attachmentId: attachment.id 
    }

  } catch (error) {
    console.error('Error saving attachment metadata:', error)
    return { 
      success: false, 
      error: 'Une erreur est survenue lors de la sauvegarde' 
    }
  }
}

export async function getFileDownloadUrl(
  attachmentId: string
): Promise<{ success: boolean; error?: string; downloadUrl?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Get attachment with message info
    const attachment = await prisma.messageAttachment.findFirst({
      where: { id: attachmentId },
      include: {
        message: true
      }
    })

    if (!attachment) {
      return { success: false, error: 'Fichier non trouvé' }
    }

    // Verify user has access to this message
    const hasAccess = 
      attachment.message.senderId === currentUser.id || 
      attachment.message.receiverId === currentUser.id

    if (!hasAccess) {
      return { success: false, error: 'Accès refusé à ce fichier' }
    }

    // Return the file path - client will generate signed URL
    return { 
      success: true, 
      downloadUrl: attachment.filePath 
    }

  } catch (error) {
    console.error('File download error:', error)
    return { 
      success: false, 
      error: 'Une erreur est survenue lors du téléchargement' 
    }
  }
}
