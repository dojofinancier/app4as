'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, File, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveAttachmentMetadata } from '@/lib/actions/file-upload-direct'
import { formatFileSize, getFileIcon } from '@/lib/utils/file-utils'

interface FileUploadDirectProps {
  messageId: string
  onUploadComplete: (attachmentId: string) => void
  onUploadError: (error: string) => void
}

export function FileUploadDirect({ messageId, onUploadComplete, onUploadError }: FileUploadDirectProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0] // Only handle one file at a time
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      console.log('Starting direct upload:', { fileName: file.name, fileSize: file.size })
      
      // Validate file size
      const MAX_FILE_SIZE = 32 * 1024 * 1024 // 32MB
      if (file.size > MAX_FILE_SIZE) {
        onUploadError(`Le fichier est trop volumineux. Taille maximale: 32MB`)
        return
      }

      // Validate file type
      const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        onUploadError(`Type de fichier non supporté. Types autorisés: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP`)
        return
      }

      // Create Supabase client
      const supabase = createClient()

      // Generate unique file path
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `message-attachments/${messageId}/${timestamp}_${sanitizedFileName}`

      console.log('Uploading to path:', filePath)

      // Upload file directly to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100)
            setUploadProgress(percent)
          }
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        onUploadError(`Erreur lors du téléchargement: ${uploadError.message}`)
        return
      }

      console.log('File uploaded successfully:', uploadData)

      // Save metadata to database
      const metadataResult = await saveAttachmentMetadata({
        messageId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: uploadData.path
      })

      if (metadataResult.success && metadataResult.attachmentId) {
        console.log('Metadata saved:', metadataResult.attachmentId)
        onUploadComplete(metadataResult.attachmentId)
      } else {
        console.error('Metadata save failed:', metadataResult.error)
        onUploadError(metadataResult.error || 'Erreur lors de la sauvegarde des métadonnées')
      }

    } catch (error) {
      console.error('Upload error:', error)
      onUploadError(`Erreur: ${error instanceof Error ? error.message : 'Une erreur inattendue est survenue'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="p-4 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            Glissez-déposez un fichier ici ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOC, DOCX, JPG, PNG, GIF, WEBP (max 32MB)
          </p>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={isUploading}
      />

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Téléchargement en cours... {uploadProgress}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

interface FileAttachmentDirectProps {
  attachment: {
    id: string
    fileName: string
    fileSize: number
    fileType: string
    createdAt: string
  }
  onDownload: (attachmentId: string) => void
}

export function FileAttachmentDirect({ attachment, onDownload }: FileAttachmentDirectProps) {
  const fileIcon = getFileIcon(attachment.fileType)
  const fileSize = formatFileSize(attachment.fileSize)

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
      <div className="text-2xl">{fileIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {attachment.fileName}
        </p>
        <p className="text-xs text-gray-500">
          {fileSize} • {attachment.fileType}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onDownload(attachment.id)}
        className="flex-shrink-0"
      >
        <File className="h-4 w-4 mr-2" />
        Télécharger
      </Button>
    </div>
  )
}

interface ErrorNotificationProps {
  message: string
  onDismiss: () => void
}

export function ErrorNotification({ message, onDismiss }: ErrorNotificationProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
      <p className="text-sm text-red-800 flex-1">{message}</p>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDismiss}
        className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
