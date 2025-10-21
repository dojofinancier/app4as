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

export async function uploadFile(
  messageId: string,
  fileData: {
    name: string
    size: number
    type: string
    base64: string
  }
): Promise<{ success: boolean; error?: string; attachmentId?: string }> {
  try {
    console.log('Upload file called:', { messageId, fileName: fileData.name, fileSize: fileData.size })
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log('No current user found')
      return { success: false, error: 'Non autorisé' }
    }
    
    console.log('Current user:', currentUser.id)

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

    // Verify message exists and user has access
    console.log('Looking for message:', messageId)
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: currentUser.id },
          { receiverId: currentUser.id }
        ]
      }
    })

    console.log('Message found:', message ? 'Yes' : 'No')
    if (!message) {
      return { success: false, error: 'Message non trouvé ou accès refusé' }
    }

    console.log('Message details:', { id: message.id, senderId: message.senderId, receiverId: message.receiverId })

    // Create Supabase client
    const supabase = await createClient()
    console.log('Supabase client created')

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = fileData.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `message-attachments/${messageId}/${timestamp}_${sanitizedFileName}`
    console.log('File path:', filePath)

    // Convert base64 to Blob for Supabase
    const binaryString = atob(fileData.base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const fileBlob = new Blob([bytes], { type: fileData.type })

    // Upload file to Supabase Storage
    console.log('Starting Supabase upload...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(filePath, fileBlob, {
        cacheControl: '3600',
        upsert: false
      })

    console.log('Supabase upload result:', { uploadData, uploadError })
    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return { 
        success: false, 
        error: `Erreur lors du téléchargement du fichier: ${uploadError.message}` 
      }
    }

    // Save attachment record to database
    console.log('Saving attachment to database...')
    try {
      const attachment = await prisma.messageAttachment.create({
        data: {
          messageId,
          fileName: fileData.name,
          fileSize: fileData.size,
          fileType: fileData.type,
          filePath: uploadData.path
        }
      })
      console.log('Attachment saved:', attachment.id)

      return { 
        success: true, 
        attachmentId: attachment.id 
      }
    } catch (dbError) {
      console.error('Database save error:', dbError)
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

    // Create Supabase client
    const supabase = await createClient()

    // Generate signed URL for download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(attachment.filePath, 3600) // 1 hour expiry

    if (signedUrlError) {
      console.error('Supabase signed URL error:', signedUrlError)
      return { 
        success: false, 
        error: 'Erreur lors de la génération du lien de téléchargement' 
      }
    }

    return { 
      success: true, 
      downloadUrl: signedUrlData.signedUrl 
    }

  } catch (error) {
    console.error('File download error:', error)
    return { 
      success: false, 
      error: 'Une erreur est survenue lors du téléchargement' 
    }
  }
}

