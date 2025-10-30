'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, User, Database, AlertTriangle, CheckCircle } from 'lucide-react'

interface AuthState {
  success: boolean
  currentUser?: {
    id: string
    email: string
    metadata: any
    lastSignIn: string
    createdAt: string
  } | null
  userInDatabase: boolean
  dbUser?: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    createdAt: string
  } | null
  message: string
  error?: string
}

interface DatabaseUsers {
  success: boolean
  users: Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    createdAt: string
  }>
  count: number
  error?: string
}

export function AuthStateDebug() {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [dbUsers, setDbUsers] = useState<DatabaseUsers | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchAuthState = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/auth-state')
      const data = await response.json()
      setAuthState(data.authState)
      setDbUsers(data.databaseUsers)
    } catch (error) {
      console.error('Error fetching auth state:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearAuthState = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/auth-state', { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        await fetchAuthState() // Refresh state
      }
    } catch (error) {
      console.error('Error clearing auth state:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthState()
  }, [])

  if (!authState || !dbUsers) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading auth state...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Current Auth State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Authentication State
            <Button
              onClick={fetchAuthState}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {authState.currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">User Authenticated</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>ID:</strong> {authState.currentUser.id}
                </div>
                <div>
                  <strong>Email:</strong> {authState.currentUser.email}
                </div>
                <div>
                  <strong>Last Sign In:</strong> {new Date(authState.currentUser.lastSignIn).toLocaleString()}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(authState.currentUser.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Database Status:</span>
                {authState.userInDatabase ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Exists in Database
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    NOT in Database
                  </Badge>
                )}
              </div>
              
              {authState.dbUser && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Database User Info:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                    <div><strong>Name:</strong> {authState.dbUser.firstName} {authState.dbUser.lastName}</div>
                    <div><strong>Role:</strong> {authState.dbUser.role}</div>
                    <div><strong>Created:</strong> {new Date(authState.dbUser.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              
              <Button
                onClick={clearAuthState}
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                Clear Auth State
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>No user currently authenticated</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Perfect for testing guest flow!
              </p>
            </div>
          )}
          
          {authState.error && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {authState.error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Users ({dbUsers.count})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dbUsers.users.length > 0 ? (
            <div className="space-y-3">
              {dbUsers.users.map((user) => (
                <div key={user.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{user.role}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No users in database
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
