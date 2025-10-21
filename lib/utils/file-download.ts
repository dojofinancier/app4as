import { createClient } from '@/lib/supabase/client'

export async function downloadFile(filePath: string, fileName: string) {
  try {
    const supabase = createClient()
    
    // Generate signed URL for download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (signedUrlError) {
      console.error('Error generating download URL:', signedUrlError)
      throw new Error('Erreur lors de la génération du lien de téléchargement')
    }

    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = signedUrlData.signedUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}
