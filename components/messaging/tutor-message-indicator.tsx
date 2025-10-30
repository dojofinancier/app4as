'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'
import { getUnreadMessageCountForStudent } from '@/lib/actions/messaging'

interface TutorMessageIndicatorProps {
  studentId: string
}

export function TutorMessageIndicator({ studentId }: TutorMessageIndicatorProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const result = await getUnreadMessageCountForStudent(studentId)
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
    
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [studentId])

  const handleMessageClick = () => {
    router.push(`/tuteur/tableau-de-bord?tab=messages&student=${studentId}`)
  }

  if (loading) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Messages
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMessageClick}
      className="relative"
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Messages
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  )
}
