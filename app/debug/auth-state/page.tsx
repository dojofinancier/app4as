import { AuthStateDebug } from '@/components/debug/auth-state-debug'

export default function AuthStateDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Authentication State Debug</h1>
        <p className="text-muted-foreground">
          Check current authentication state and database users
        </p>
      </div>
      
      <AuthStateDebug />
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Testing Instructions:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• If a user is authenticated but NOT in database, click "Clear Auth State"</li>
          <li>• This will allow you to test the guest booking flow properly</li>
          <li>• Remove this debug page after testing is complete</li>
        </ul>
      </div>
    </div>
  )
}
