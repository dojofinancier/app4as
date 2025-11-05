'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Mail } from 'lucide-react'
import { logClientError } from '@/lib/utils/error-logging'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

/**
 * Error Boundary component to catch React errors and display user-friendly error messages
 * 
 * Features:
 * - Catches React component errors
 * - Logs errors to database
 * - Shows user-friendly French error message
 * - Displays support email
 * - Provides reset button
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to database
    logClientError(
      error.message || 'Une erreur inattendue est survenue',
      error.stack || errorInfo.componentStack || undefined,
      {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        componentStack: errorInfo.componentStack || undefined,
      }
    ).then((errorId) => {
      this.setState({ errorId })
    }).catch((logError) => {
      console.error('Failed to log error:', logError)
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    })
    // Reload page to fully reset state
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Une erreur est survenue</CardTitle>
              </div>
              <CardDescription>
                Désolé, une erreur inattendue s'est produite. Notre équipe a été informée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {this.state.errorId && (
                  <p className="mb-2">
                    <strong>ID d'erreur:</strong> {this.state.errorId}
                  </p>
                )}
                <p>
                  Si ce problème persiste, veuillez contacter notre équipe de support.
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href="mailto:support@carredastutorat.com"
                  className="text-sm text-primary hover:underline"
                >
                  support@carredastutorat.com
                </a>
              </div>

              <Button onClick={this.handleReset} className="w-full" variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

