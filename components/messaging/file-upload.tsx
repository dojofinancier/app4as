'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, File, AlertCircle } from 'lucide-react'
import { formatFileSize, getFileIcon } from '@/lib/utils/file-utils'

interface FileUploadProps {
  receiverId: string
  onUploadComplete: (file: File) => void
  onUploadError: (error: string) => void
}

export function FileUpload({ receiverId: _receiverId, onUploadComplete, onUploadError }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0] // Only handle one file at a time
    await uploadSingleFile(file)
  }

  const uploadSingleFile = async (file: File) => {
    setIsUploading(true)
    
    try {
      console.log('File selected:', { fileName: file.name, fileSize: file.size })
      
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

      // File is valid, pass it to the parent component
      onUploadComplete(file)
    } catch (error) {
      console.error('File validation error:', error)
      onUploadError(`Erreur: ${error instanceof Error ? error.message : 'Une erreur inattendue est survenue'}`)
    } finally {
      setIsUploading(false)
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
            : 'border-border hover:border-border'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="p-4 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            Glissez-déposez un fichier ici ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-muted-foreground">
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
        <div className="flex items-center gap-2 text-sm text-info">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-info"></div>
          Téléchargement en cours...
        </div>
      )}
    </div>
  )
}

interface FileAttachmentProps {
  attachment: {
    id: string
    fileName: string
    fileSize: number
    fileType: string
    createdAt: string
  }
  onDownload: (attachmentId: string) => void
}

export function FileAttachment({ attachment, onDownload }: FileAttachmentProps) {
  const fileIcon = getFileIcon(attachment.fileType)
  const fileSize = formatFileSize(attachment.fileSize)

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
      <div className="text-2xl">{fileIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {attachment.fileName}
        </p>
        <p className="text-xs text-muted-foreground">
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
    <div className="flex items-center gap-2 p-3 bg-error-light border border-error-border rounded-lg">
      <AlertCircle className="h-4 w-4 text-error flex-shrink-0" />
      <p className="text-sm text-error flex-1">{message}</p>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDismiss}
        className="h-6 w-6 p-0 text-error hover:text-error/80"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
