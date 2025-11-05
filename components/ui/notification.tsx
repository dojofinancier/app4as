'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react'
import { Button } from './button'

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  onDismiss: () => void
  autoDismiss?: boolean
  duration?: number
}

export function Notification({
  type,
  title,
  message,
  onDismiss,
  autoDismiss = true,
  duration = 5000
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onDismiss, 300) // Allow fade out animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoDismiss, duration, onDismiss])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-error" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />
      case 'info':
        return <Info className="h-5 w-5 text-info" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-success-light border-success-border'
      case 'error':
        return 'bg-error-light border-error-border'
      case 'warning':
        return 'bg-warning-light border-warning-border'
      case 'info':
        return 'bg-info-light border-info-border'
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-success'
      case 'error':
        return 'text-error'
      case 'warning':
        return 'text-warning'
      case 'info':
        return 'text-info'
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
    }`}>
      <div className={`p-4 border rounded-lg shadow-lg ${getBackgroundColor()}`}>
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className={`font-medium ${getTextColor()}`}>
              {title}
            </h4>
            {message && (
              <p className={`text-sm mt-1 ${getTextColor()}`}>
                {message}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false)
              setTimeout(onDismiss, 300)
            }}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Notification context for global notifications
interface NotificationContextType {
  showNotification: (notification: Omit<NotificationProps, 'onDismiss'>) => void
}

export const NotificationContext = React.createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Array<NotificationProps & { id: string }>>([])

  const showNotification = (notification: Omit<NotificationProps, 'onDismiss'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = {
      ...notification,
      id,
      onDismiss: () => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    }
    setNotifications(prev => [...prev, newNotification])
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map(notification => (
        <Notification key={notification.id} {...notification} />
      ))}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
