import { testAdminTutorCreation } from '@/lib/actions/test-admin'

export default async function TestAdminPage() {
  const result = await testAdminTutorCreation()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test Admin Tutor Creation</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Make sure you're logged in as an admin user</li>
          <li>Check that SUPABASE_SERVICE_ROLE_KEY is set in your .env.local file</li>
          <li>If the test fails, verify the service role key is correct</li>
        </ol>
      </div>
    </div>
  )
}
