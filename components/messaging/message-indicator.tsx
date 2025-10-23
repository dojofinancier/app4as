'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'
import { getUnreadMessageCount } from '@/lib/actions/messaging'

interface MessageIndicatorProps {
  tutorId: string
}

export function MessageIndicator({ tutorId }: MessageIndicatorProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const result = await getUnreadMessageCount()
        if (result.success && result.count !== undefined) {
          setUnreadCount(result.count)
        }
      } catch (error) {
        console.error('Error loading unread count:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUnreadCount()
  }, [])

  const handleMessageClick = () => {
    // Navigate to messages tab and select this tutor
    router.push('/tableau-de-bord?tab=messages&tutor=' + tutorId)
  }

  if (loading) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMessageClick}
      className="relative"
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Message
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount}
        </Badge>
      )}
    </Button>
  )
}
