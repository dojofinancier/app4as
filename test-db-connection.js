const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful!')
    console.log('Result:', result)
    
    // Try to get user count
    const userCount = await prisma.user.count()
    console.log(`📊 Total users in database: ${userCount}`)
    
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    if (error.code === 'P1001') {
      console.log('\n🔧 Troubleshooting suggestions:')
      console.log('1. Check if your Supabase project is active (not paused)')
      console.log('2. Verify your DATABASE_URL in .env file')
      console.log('3. Check if your password is correct')
      console.log('4. Try using direct connection instead of pooler')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

